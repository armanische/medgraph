import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ContentAddressedArtifactStore } from "./core/artifact-store.ts";
import type {
  ImportOutput,
  IngestionPlan,
  NormalizedDocumentLink,
  NormalizedRecord,
  ProviderAdapter,
  RawArtifact,
  RawRegistryRecord,
} from "./core/contracts.ts";
import { StreamingDownloader } from "./core/downloader.ts";
import { ImportManifestStore } from "./core/manifest-store.ts";
import { determineImportStatus } from "./core/status.ts";

const PROVIDER = "roszdravnadzor";
const WIDGET_URL = "https://elk.roszdravnadzor.gov.ru/widget/";
const OFFICIAL_ORIGIN = "https://elk.roszdravnadzor.gov.ru";
const DOWNLOAD_ENDPOINT =
  `${OFFICIAL_ORIGIN}/public-gateway/med-product/api/v1/files/` +
  "download-by-path-public";
const DOM_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 45_000;
const MAX_CAPTURED_JSON_RESPONSES = 100;
const IGNORE_HTTPS_ERRORS_ENV = "ROSRZN_IGNORE_HTTPS_ERRORS";
const TLS_BYPASS_WARNING =
  "SECURITY WARNING: TLS certificate validation was disabled for this import " +
  "because ROSRZN_IGNORE_HTTPS_ERRORS=1. Development use only; transport " +
  "authenticity was not verified.";

interface ScalarEntry {
  path: string;
  value: string;
}

interface DomData {
  pairs: Array<{ label: string; value: string }>;
  links: Array<{ title: string; url: string }>;
}

interface LocatorLike {
  count(): Promise<number>;
  nth(index: number): LocatorLike;
  isVisible(): Promise<boolean>;
  getAttribute(name: string): Promise<string | null>;
  innerText(): Promise<string>;
  fill(value: string): Promise<void>;
  press(key: string): Promise<void>;
  click(): Promise<void>;
}

interface BrowserResponseLike {
  url(): string;
  headers(): Record<string, string>;
  body(): Promise<Buffer>;
}

interface PageLike {
  locator(selector: string): LocatorLike;
  goto(
    url: string,
    options: { waitUntil: string; timeout: number },
  ): Promise<unknown>;
  url(): string;
  content(): Promise<string>;
  waitForSelector(
    selector: string,
    options: { timeout: number; state?: string },
  ): Promise<unknown>;
  waitForResponse(
    predicate: (response: BrowserResponseLike) => boolean,
    options: { timeout: number },
  ): Promise<BrowserResponseLike>;
  waitForLoadState(
    state: "networkidle",
    options: { timeout: number },
  ): Promise<void>;
  on(
    event: "response",
    listener: (response: BrowserResponseLike) => void,
  ): void;
  evaluate<TResult>(callback: () => TResult): Promise<TResult>;
  evaluate<TResult, TArgument>(
    callback: (argument: TArgument) => TResult,
    argument: TArgument,
  ): Promise<TResult>;
  close(): Promise<void>;
}

interface BrowserContextLike {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
}

interface BrowserLike {
  newContext(options: {
    locale: string;
    userAgent: string;
    ignoreHTTPSErrors?: boolean;
  }): Promise<BrowserContextLike>;
  close(): Promise<void>;
}

interface PlaywrightLike {
  chromium: {
    launch(options: {
      executablePath: string;
      headless: boolean;
    }): Promise<BrowserLike>;
  };
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeRegistrationNumber(value: string) {
  return normalizeSpace(value)
    .replace(/[№#]/g, "")
    .replace(/\s*\/\s*/g, "/")
    .toLocaleUpperCase("ru-RU");
}

interface RoszdravnadzorTlsPolicy {
  ignoreHTTPSErrors: boolean;
  warning: string | null;
}

function resolveRoszdravnadzorTlsPolicy(
  environment: NodeJS.ProcessEnv = process.env,
): RoszdravnadzorTlsPolicy {
  const requested = environment[IGNORE_HTTPS_ERRORS_ENV] === "1";

  if (!requested) {
    return { ignoreHTTPSErrors: false, warning: null };
  }

  if (environment.NODE_ENV === "production") {
    return {
      ignoreHTTPSErrors: false,
      warning:
        "ROSRZN_IGNORE_HTTPS_ERRORS=1 was ignored because NODE_ENV=production. " +
        "TLS certificate validation remains enabled.",
    };
  }

  return {
    ignoreHTTPSErrors: true,
    warning: TLS_BYPASS_WARNING,
  };
}

function isCertificateAuthorityError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /ERR_CERT_AUTHORITY_INVALID|certificate authority invalid/i.test(
    `${error.name} ${error.message}`,
  );
}

function createTlsBlockedOutput(
  error: unknown,
  query: string,
  priorWarnings: string[] = [],
): ImportOutput | null {
  if (!isCertificateAuthorityError(error)) return null;

  return {
    normalizedRecord: null,
    ingestionPlan: null,
    manifestPath: null,
    downloadedArtifactPaths: [],
    status: "blocked",
    warnings: [
      ...priorWarnings,
      "TLS certificate validation failed " +
        "(ERR_CERT_AUTHORITY_INVALID). Import was blocked; no registry data " +
        "was accepted. Fix the certificate trust chain or, for local " +
        "development only, run: " +
        `ROSRZN_IGNORE_HTTPS_ERRORS=1 npm run import:roszdravnadzor -- ${JSON.stringify(query)}`,
    ],
  };
}

function stableSlug(value: string) {
  const normalized = normalizeSpace(value)
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (normalized) return normalized.slice(0, 100);
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function collectScalarEntries(
  value: unknown,
  path = "",
  entries: ScalarEntry[] = [],
  depth = 0,
) {
  if (depth > 9 || entries.length >= 20_000) return entries;
  if (typeof value === "string" || typeof value === "number") {
    const text = normalizeSpace(String(value));
    if (text) entries.push({ path, value: text });
    return entries;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectScalarEntries(item, `${path}[${index}]`, entries, depth + 1),
    );
    return entries;
  }
  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) =>
      collectScalarEntries(
        item,
        path ? `${path}.${key}` : key,
        entries,
        depth + 1,
      ),
    );
  }
  return entries;
}

function findValue(entries: ScalarEntry[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = entries.find((entry) => pattern.test(entry.path));
    if (match) return match.value;
  }
  return null;
}

function valueFromDom(
  pairs: DomData["pairs"],
  patterns: RegExp[],
) {
  return (
    pairs.find(({ label }) => patterns.some((pattern) => pattern.test(label)))
      ?.value ?? null
  );
}

function findMatchingApiRecord(payloads: unknown[], registrationNumber: string) {
  const target = normalizeRegistrationNumber(registrationNumber);
  const queue: Array<{ value: unknown; depth: number }> = payloads.map(
    (value) => ({ value, depth: 0 }),
  );
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    if (!current || current.depth > 9) continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((item) =>
        queue.push({ value: item, depth: current.depth + 1 }),
      );
      continue;
    }
    if (typeof current.value !== "object" || current.value === null) continue;
    const record = current.value as Record<string, unknown>;
    if (
      Object.values(record).some(
        (item) =>
          typeof item === "string" &&
          normalizeRegistrationNumber(item) === target,
      )
    ) {
      return record;
    }
    Object.values(record).forEach((item) =>
      queue.push({ value: item, depth: current.depth + 1 }),
    );
  }
  return null;
}

function documentTypeFor(title: string, url: string) {
  const value = `${title} ${url}`.toLocaleLowerCase("ru-RU");
  if (/инструк|руководств|manual|ifu/.test(value)) return "ifu" as const;
  if (/приложен|application|appendix/.test(value)) {
    return "application" as const;
  }
  if (/сертификат|certificate/.test(value)) return "certificate" as const;
  if (/регистрац|удостовер|registration/.test(value)) {
    return "registration" as const;
  }
  return "other" as const;
}

function collectDocumentLinksFromJson(payloads: unknown[]) {
  const links: Array<{ title: string; url: string }> = [];

  function visit(value: unknown, depth = 0) {
    if (depth > 9 || value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    const record = value as Record<string, unknown>;
    const id = record.id ?? record.fileId ?? record.file_id;
    const path =
      record.path ?? record.filePath ?? record.file_path ?? record.storagePath;
    const title = normalizeSpace(
      String(
        record.name ??
          record.fileName ??
          record.filename ??
          record.title ??
          "Документ Росздравнадзора",
      ),
    );

    if (
      (typeof id === "string" || typeof id === "number") &&
      typeof path === "string"
    ) {
      const url = new URL(DOWNLOAD_ENDPOINT);
      url.searchParams.set("id", String(id));
      url.searchParams.set("path", path);
      links.push({ title, url: url.href });
    }

    Object.entries(record).forEach(([key, item]) => {
      if (
        typeof item === "string" &&
        /^https?:\/\//i.test(item) &&
        (/file|document|instruction|certificate|удостовер/i.test(key) ||
          /download-by-path-public|\.pdf(?:$|\?)/i.test(item))
      ) {
        links.push({ title, url: item });
      }
      visit(item, depth + 1);
    });
  }

  payloads.forEach((payload) => visit(payload));
  return links;
}

function normalizeDocumentLinks(
  registrationNumber: string,
  values: Array<{ title: string; url: string }>,
) {
  const seenUrls = new Set<string>();
  const baseIdentityCounts = new Map<string, number>();
  const documents: NormalizedDocumentLink[] = [];

  for (const value of values) {
    let url: URL;
    try {
      url = new URL(value.url, OFFICIAL_ORIGIN);
    } catch {
      continue;
    }
    if (
      url.protocol !== "https:" ||
      url.hostname !== "elk.roszdravnadzor.gov.ru" ||
      seenUrls.has(url.href)
    ) {
      continue;
    }
    seenUrls.add(url.href);

    const title = normalizeSpace(value.title) || "Документ Росздравнадзора";
    const documentType = documentTypeFor(title, url.href);
    const titleIdentity = stableSlug(title);
    const baseIdentity = `${PROVIDER}:${normalizeRegistrationNumber(
      registrationNumber,
    )}:${documentType}:${titleIdentity}`;
    const ordinal = (baseIdentityCounts.get(baseIdentity) ?? 0) + 1;
    baseIdentityCounts.set(baseIdentity, ordinal);
    const documentKey = ordinal === 1 ? baseIdentity : `${baseIdentity}:${ordinal}`;

    documents.push({
      externalId: documentKey,
      documentKey,
      documentType,
      title,
      url: url.href,
    });
  }

  return documents;
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
  const { access } = await import("node:fs/promises");

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through conventional browser installation paths.
    }
  }
  return null;
}

async function loadPlaywrightCore(): Promise<PlaywrightLike> {
  try {
    const packageName = "playwright-core";
    return (await import(packageName)) as unknown as PlaywrightLike;
  } catch {
    throw new Error(
      "playwright-core is not installed. Run npm install before importing.",
    );
  }
}

async function detectTechnicalBlock(page: PageLike) {
  const bodyText = normalizeSpace(
    await page.locator("body").innerText().catch(() => ""),
  ).toLocaleLowerCase("ru-RU");
  const captchaFrames = await page
    .locator('iframe[src*="captcha"], iframe[title*="captcha" i]')
    .count();

  if (
    captchaFrames > 0 ||
    bodyText.includes("captcha") ||
    bodyText.includes("капча") ||
    bodyText.includes("подтвердите, что вы не робот")
  ) {
    return "The provider requested CAPTCHA; importer stopped without bypass.";
  }
  if (
    bodyText.includes("доступ запрещен") ||
    bodyText.includes("access denied") ||
    bodyText.includes("forbidden")
  ) {
    return "The provider denied access to the public widget.";
  }
  return null;
}

async function findSearchInput(page: PageLike) {
  await page.waitForSelector("input", {
    timeout: DOM_TIMEOUT_MS,
    state: "visible",
  });
  const inputs = page.locator("input");
  const inputCount = await inputs.count();
  let selected: LocatorLike | null = null;
  let selectedScore = 0;

  for (let index = 0; index < Math.min(inputCount, 40); index += 1) {
    const input = inputs.nth(index);
    if (!(await input.isVisible().catch(() => false))) continue;
    const descriptor = [
      await input.getAttribute("placeholder"),
      await input.getAttribute("aria-label"),
      await input.getAttribute("name"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ru-RU");
    const score =
      (descriptor.includes("регистрац") ? 10 : 0) +
      (descriptor.includes("номер") ? 4 : 0) +
      (descriptor.includes("поиск") ? 2 : 0);
    if (score > selectedScore) {
      selected = input;
      selectedScore = score;
    }
  }

  if (!selected) {
    throw new Error("Registration-number search input was not found.");
  }
  return selected;
}

function isRegistryApiResponse(response: BrowserResponseLike) {
  return (
    response.url().includes("/public-gateway/med-product/") &&
    (response.headers()["content-type"] ?? "").includes("json")
  );
}

async function submitSearch(
  page: PageLike,
  registrationNumber: string,
  warnings: string[],
) {
  const input = await findSearchInput(page);
  await input.fill(registrationNumber);
  const responsePromise = page
    .waitForResponse(isRegistryApiResponse, { timeout: DOM_TIMEOUT_MS })
    .catch(() => null);
  await input.press("Enter");
  const response = await responsePromise;
  if (!response) {
    warnings.push(
      "No registry JSON response was observed after search submission.",
    );
  }
  await page
    .waitForSelector('a[href*="/widget/med-product/"]', {
      timeout: DOM_TIMEOUT_MS,
    })
    .catch(() => {
      warnings.push("Registry result link did not appear before timeout.");
    });
}

async function clickSearchButton(page: PageLike, warnings: string[]) {
  const buttons = page.locator('button, input[type="submit"]');
  const count = await buttons.count();

  for (let index = 0; index < Math.min(count, 40); index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible().catch(() => false))) continue;
    const label = normalizeSpace(
      `${await button.innerText().catch(() => "")} ${
        (await button.getAttribute("value")) ?? ""
      }`,
    ).toLocaleLowerCase("ru-RU");
    if (!label.includes("найти") && !label.includes("поиск")) continue;

    const responsePromise = page
      .waitForResponse(isRegistryApiResponse, { timeout: DOM_TIMEOUT_MS })
      .catch(() => null);
    await button.click();
    const response = await responsePromise;
    if (!response) {
      warnings.push(
        "No registry JSON response was observed after search button click.",
      );
    }
    await page
      .waitForSelector('a[href*="/widget/med-product/"]', {
        timeout: DOM_TIMEOUT_MS,
      })
      .catch(() => {
        warnings.push(
          "Registry result link did not appear after search button click.",
        );
      });
    return;
  }

  warnings.push("Search button was not found after Enter submission.");
}

async function findRegistryRecordUrl(
  page: PageLike,
  registrationNumber: string,
) {
  return page.evaluate(
    ({ expected }: { expected: string }) => {
      const normalize = (value: string) =>
        value
          .replace(/\s+/g, " ")
          .trim()
          .replace(/[№#]/g, "")
          .replace(/\s*\/\s*/g, "/")
          .toLocaleUpperCase("ru-RU");
      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          'a[href*="/widget/med-product/"]',
        ),
      );
      const match = anchors.find((anchor) => {
        const context =
          anchor.closest("tr")?.textContent ??
          anchor.closest("article")?.textContent ??
          anchor.parentElement?.textContent ??
          anchor.textContent ??
          "";
        return normalize(context).includes(expected);
      });
      return match?.href ?? null;
    },
    { expected: normalizeRegistrationNumber(registrationNumber) },
  );
}

async function collectDomData(page: PageLike): Promise<DomData> {
  return page.evaluate(() => {
    const pairs: Array<{ label: string; value: string }> = [];
    document.querySelectorAll("tr").forEach((row) => {
      const cells = Array.from(row.querySelectorAll("th,td"))
        .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean);
      if (cells.length >= 2) {
        pairs.push({ label: cells[0], value: cells.slice(1).join(" · ") });
      }
    });
    document.querySelectorAll("dt").forEach((term) => {
      const label = term.textContent?.replace(/\s+/g, " ").trim();
      const value = term.nextElementSibling?.textContent
        ?.replace(/\s+/g, " ")
        .trim();
      if (label && value) pairs.push({ label, value });
    });
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"))
      .filter(
        (anchor) =>
          anchor.href.includes("download-by-path-public") ||
          /\.pdf(?:$|\?)/i.test(anchor.href),
      )
      .map((anchor) => ({
        title:
          anchor.textContent?.replace(/\s+/g, " ").trim() ||
          anchor.getAttribute("download") ||
          "Документ Росздравнадзора",
        url: anchor.href,
      }));
    return { pairs, links };
  });
}

function registryRecordIdFromUrl(value: string) {
  const match = new URL(value).pathname.match(/\/med-product\/([^/]+)$/);
  return match?.[1] ?? null;
}

class RoszdravnadzorAdapter implements ProviderAdapter {
  readonly provider = PROVIDER;
  readonly warnings: string[];
  private readonly artifactStore: ContentAddressedArtifactStore;
  private readonly downloader: StreamingDownloader;
  private readonly tlsPolicy: RoszdravnadzorTlsPolicy;

  constructor(
    artifactStore: ContentAddressedArtifactStore,
    options: { environment?: NodeJS.ProcessEnv } = {},
  ) {
    this.artifactStore = artifactStore;
    this.downloader = new StreamingDownloader({ artifactStore });
    this.tlsPolicy = resolveRoszdravnadzorTlsPolicy(options.environment);
    this.warnings = this.tlsPolicy.warning ? [this.tlsPolicy.warning] : [];
  }

  async fetchRawRecord(query: string): Promise<RawRegistryRecord | null> {
    const playwright = await loadPlaywrightCore();
    const executablePath = await findChromeExecutable();
    if (!executablePath) {
      throw new Error(
        "Google Chrome/Chromium was not found. Configure CHROME_PATH.",
      );
    }

    const browser = await playwright.chromium.launch({
      executablePath,
      headless: true,
    });
    let context: BrowserContextLike | null = null;
    let page: PageLike | null = null;

    try {
      context = await browser.newContext({
        locale: "ru-RU",
        userAgent:
          "CyberMedica-Regulatory-Importer/0.2 (+manual ingestion review)",
        ignoreHTTPSErrors: this.tlsPolicy.ignoreHTTPSErrors,
      });
      page = await context.newPage();
      const capturedPayloads: unknown[] = [];
      const jsonArtifacts: RawArtifact[] = [];
      const htmlArtifacts: RawArtifact[] = [];
      const pendingCaptures: Promise<void>[] = [];

      page.on("response", (response) => {
        if (
          !isRegistryApiResponse(response) ||
          pendingCaptures.length >= MAX_CAPTURED_JSON_RESPONSES
        ) {
          return;
        }
        const capture = (async () => {
          const bytes = await response.body();
          const artifact = await this.artifactStore.saveBytes({
            kind: "registry-json",
            sourceUrl: response.url(),
            contentType:
              response.headers()["content-type"] ?? "application/json",
            extension: ".json",
            bytes,
          });
          jsonArtifacts.push(artifact);
          try {
            capturedPayloads.push(JSON.parse(bytes.toString("utf8")));
          } catch {
            this.warnings.push(
              `Registry JSON response could not be parsed: ${response.url()}`,
            );
          }
        })().catch((error) => {
          this.warnings.push(
            `Registry response capture failed: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          );
        });
        pendingCaptures.push(capture);
      });

      await page.goto(WIDGET_URL, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await page.waitForSelector("body", { timeout: DOM_TIMEOUT_MS });
      const initialBlock = await detectTechnicalBlock(page);
      if (initialBlock) throw new Error(initialBlock);

      await submitSearch(page, query, this.warnings);
      let registryRecordUrl = await findRegistryRecordUrl(page, query);
      if (!registryRecordUrl) {
        await clickSearchButton(page, this.warnings);
        registryRecordUrl = await findRegistryRecordUrl(page, query);
      }
      if (!registryRecordUrl) return null;

      await page.goto(registryRecordUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await page.waitForSelector("body", { timeout: DOM_TIMEOUT_MS });
      await page
        .waitForLoadState("networkidle", { timeout: DOM_TIMEOUT_MS })
        .catch(() => {
          this.warnings.push(
            "Registry detail page did not reach network idle before timeout.",
          );
        });
      const block = await detectTechnicalBlock(page);
      if (block) throw new Error(block);

      await Promise.allSettled(pendingCaptures);
      const html = await page.content();
      htmlArtifacts.push(
        await this.artifactStore.saveBytes({
          kind: "registry-html",
          sourceUrl: registryRecordUrl,
          contentType: "text/html; charset=utf-8",
          extension: ".html",
          bytes: Buffer.from(html, "utf8"),
        }),
      );
      const domData = await collectDomData(page);

      return {
        provider: PROVIDER,
        query,
        registrationNumber: query,
        registryRecordId: registryRecordIdFromUrl(registryRecordUrl),
        sourceUrl: registryRecordUrl,
        capturedAt: new Date().toISOString(),
        payloads: capturedPayloads,
        htmlArtifacts,
        jsonArtifacts,
        metadata: { domData },
      };
    } finally {
      await page?.close().catch(() => undefined);
      await context?.close().catch(() => undefined);
      await browser.close();
    }
  }

  async normalize(rawRecord: RawRegistryRecord): Promise<NormalizedRecord> {
    const apiRecord = findMatchingApiRecord(
      rawRecord.payloads,
      rawRecord.registrationNumber,
    );
    const entries = apiRecord ? collectScalarEntries(apiRecord) : [];
    const domData =
      (rawRecord.metadata.domData as DomData | undefined) ?? {
        pairs: [],
        links: [],
      };
    const registrationNumber =
      findValue(entries, [
        /registration.*number/i,
        /certificate.*number/i,
        /reg.*number/i,
        /регистрац.*номер/i,
      ]) ??
      valueFromDom(domData.pairs, [
        /регистрационн.*номер/i,
        /номер регистрационн/i,
      ]) ??
      rawRecord.registrationNumber;

    const documentLinks = normalizeDocumentLinks(registrationNumber, [
      ...collectDocumentLinksFromJson(
        apiRecord ? [apiRecord, ...rawRecord.payloads] : rawRecord.payloads,
      ),
      ...domData.links,
    ]);

    return {
      provider: PROVIDER,
      query: rawRecord.query,
      registrationNumber,
      registryRecordId: rawRecord.registryRecordId,
      medicalDeviceName:
        findValue(entries, [
          /medical.*device.*name/i,
          /product.*name/i,
          /наименован.*медицинск.*издел/i,
        ]) ??
        valueFromDom(domData.pairs, [
          /наименован.*медицинск.*издел/i,
          /^наименование$/i,
        ]),
      manufacturer:
        findValue(entries, [
          /manufacturer.*name/i,
          /producer.*name/i,
          /производител/i,
        ]) ??
        valueFromDom(domData.pairs, [
          /организац.*производител/i,
          /производител/i,
        ]),
      status:
        findValue(entries, [/status/i, /state/i, /статус/i]) ??
        valueFromDom(domData.pairs, [/^статус/i]),
      issueDate:
        findValue(entries, [
          /issue.*date/i,
          /registration.*date/i,
          /date.*registration/i,
          /дата первичн.*регистрац/i,
        ]) ??
        valueFromDom(domData.pairs, [
          /дата первичн.*регистрац/i,
          /дата выдачи/i,
        ]),
      updatedDate:
        findValue(entries, [
          /updated.*date/i,
          /change.*date/i,
          /modified.*date/i,
          /дата внесен.*изменен/i,
        ]) ?? valueFromDom(domData.pairs, [/дата внесен.*изменен/i]),
      sourceUrl: rawRecord.sourceUrl,
      documentLinks,
    };
  }

  async createIngestionPlan(
    rawRecord: RawRegistryRecord,
    normalizedRecord: NormalizedRecord,
  ): Promise<IngestionPlan> {
    const downloadedFiles = [];
    const failedDownloads = [];

    for (const link of normalizedRecord.documentLinks) {
      const result = await this.downloader.download(link);
      if (result.artifact) downloadedFiles.push(result.artifact);
      if (result.failure) failedDownloads.push(result.failure);
    }

    const warnings = [...this.warnings];
    if (normalizedRecord.documentLinks.length === 0) {
      warnings.push(
        "The registry record exposes no downloadable documents.",
      );
    }
    failedDownloads.forEach((failure) => {
      warnings.push(
        `Document “${failure.title}” was not downloaded: ${failure.reason}`,
      );
    });
    if (!normalizedRecord.medicalDeviceName) {
      warnings.push("Medical device name is missing from the normalized record.");
    }
    if (!normalizedRecord.manufacturer) {
      warnings.push("Manufacturer is missing from the normalized record.");
    }

    const hasNormalizedIdentity = Boolean(
      normalizedRecord.registrationNumber && normalizedRecord.sourceUrl,
    );
    const documentOutcomeIsExplained =
      downloadedFiles.length > 0 ||
      warnings.some((warning) =>
        /no downloadable documents|was not downloaded/i.test(warning),
      );
    const normalizedRecordCreated = Boolean(
      hasNormalizedIdentity &&
        (normalizedRecord.medicalDeviceName || normalizedRecord.manufacturer),
    );
    const status = determineImportStatus({
      registryRecordFound: true,
      normalizedRecordCreated,
      downloadedDocumentCount: downloadedFiles.length,
      documentOutcomeWarningCount: documentOutcomeIsExplained ? 1 : 0,
      // This is eligibility; output is returned only if atomic manifest merge succeeds.
      manifestWritten: true,
    });

    return {
      provider: PROVIDER,
      query: rawRecord.query,
      registrationNumber: normalizedRecord.registrationNumber,
      registryRecordId: rawRecord.registryRecordId,
      sourceUrl: rawRecord.sourceUrl,
      rawArtifacts: [
        ...rawRecord.htmlArtifacts,
        ...rawRecord.jsonArtifacts,
      ],
      documents: [],
      documentVersions: [],
      downloadedFiles,
      failedDownloads,
      evidenceCandidates: [
        {
          kind: "registry_record",
          locator: rawRecord.sourceUrl,
          quotedText: normalizedRecord.registrationNumber,
          status: "candidate",
          requiresHumanReview: true,
        },
      ],
      claimCandidates: [
        {
          suggestedClaimType: "product.registration_number",
          valuePayload: { number: normalizedRecord.registrationNumber },
          status: "candidate",
          verificationStatus: "unverified",
          autoPublish: false,
        },
      ],
      status,
      warnings,
    };
  }
}

async function runImport(query: string): Promise<ImportOutput> {
  const artifactStore = new ContentAddressedArtifactStore();
  const manifestStore = new ImportManifestStore();
  const adapter = new RoszdravnadzorAdapter(artifactStore);
  let rawRecord: RawRegistryRecord | null;
  try {
    rawRecord = await adapter.fetchRawRecord(query);
  } catch (error) {
    const blockedOutput = createTlsBlockedOutput(
      error,
      query,
      adapter.warnings,
    );
    if (blockedOutput) return blockedOutput;
    return {
      normalizedRecord: null,
      ingestionPlan: null,
      manifestPath: null,
      downloadedArtifactPaths: [],
      status: "blocked",
      warnings: [
        ...adapter.warnings,
        error instanceof Error ? error.message : "Unknown importer error.",
      ],
    };
  }

  if (!rawRecord) {
    return {
      normalizedRecord: null,
      ingestionPlan: null,
      manifestPath: null,
      downloadedArtifactPaths: [],
      status: "not-found",
      warnings: [
        ...adapter.warnings,
        `Exact registry record was not found for ${query}.`,
      ],
    };
  }

  const normalizedRecord = await adapter.normalize(rawRecord);
  const initialPlan = await adapter.createIngestionPlan(
    rawRecord,
    normalizedRecord,
  );
  const merged = await manifestStore.merge(initialPlan);
  const finalStatus = determineImportStatus({
    registryRecordFound: true,
    normalizedRecordCreated: Boolean(
      normalizedRecord.registrationNumber &&
        normalizedRecord.sourceUrl &&
        (normalizedRecord.medicalDeviceName || normalizedRecord.manufacturer),
    ),
    downloadedDocumentCount: merged.plan.downloadedFiles.length,
    documentOutcomeWarningCount: merged.plan.warnings.filter((warning) =>
      /no downloadable documents|was not downloaded/i.test(warning),
    ).length,
    manifestWritten: true,
  });
  const finalPlan = { ...merged.plan, status: finalStatus };

  return {
    normalizedRecord,
    ingestionPlan: finalPlan,
    manifestPath: merged.manifestPath,
    downloadedArtifactPaths: finalPlan.downloadedFiles.map(
      (artifact) => artifact.filePath,
    ),
    status: finalPlan.status,
    warnings: finalPlan.warnings,
  };
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    process.stdout.write(
      `${JSON.stringify(
        {
          normalizedRecord: null,
          ingestionPlan: null,
          manifestPath: null,
          downloadedArtifactPaths: [],
          status: "blocked",
          warnings: [
            'Pass a registration number, for example: npm run import:roszdravnadzor -- "ФСЗ 2009/04992"',
          ],
        } satisfies ImportOutput,
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    const output = await runImport(query);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    if (output.status === "blocked" || output.status === "not-found") {
      process.exitCode = 2;
    }
  } catch (error) {
    const output = {
      normalizedRecord: null,
      ingestionPlan: null,
      manifestPath: null,
      downloadedArtifactPaths: [],
      status: "blocked",
      warnings: [
        error instanceof Error ? error.message : "Unknown importer error.",
      ],
    } satisfies ImportOutput;
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main();
}

export {
  RoszdravnadzorAdapter,
  createTlsBlockedOutput,
  normalizeDocumentLinks,
  resolveRoszdravnadzorTlsPolicy,
  runImport,
};
