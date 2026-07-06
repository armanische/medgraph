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
import {
  type NetworkDiagnosticEntry,
  writeRoszdravnadzorDiagnostics,
} from "./roszdravnadzor-diagnostics.ts";

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
const DETAIL_ID_ENV = "ROSRZN_DETAIL_ID";
const BROWSER_USER_AGENT =
  "CyberMedica-Regulatory-Importer/0.3 (+manual ingestion review)";
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
  boundingBox(): Promise<
    { x: number; y: number; width: number; height: number } | null
  >;
  evaluate<TResult>(callback: (element: Element) => TResult): Promise<TResult>;
}

interface BrowserResponseLike {
  url(): string;
  headers(): Record<string, string>;
  body(): Promise<Buffer>;
  status?(): number;
  request?(): {
    method(): string;
    resourceType(): string;
  };
}

interface SearchScopeLike {
  locator(selector: string): LocatorLike;
}

interface FrameLike extends SearchScopeLike {
  url(): string;
  name(): string;
  frameElement(): Promise<LocatorLike>;
}

interface PageLike extends SearchScopeLike {
  goto(
    url: string,
    options: { waitUntil: string; timeout: number },
  ): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  frames(): FrameLike[];
  screenshot(options: { path: string; fullPage: boolean }): Promise<unknown>;
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
  return value
    .replace(/[№#]/g, "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLocaleUpperCase("ru-RU");
}

interface NetworkRegistryMatch {
  record: Record<string, unknown>;
  registrationNumber: string;
  registryRecordId: string | null;
  payloadIndex: number;
  path: string;
}

interface RegistryAcquisition {
  source: "network" | "dom";
  record: Record<string, unknown> | null;
  registryRecordId: string | null;
  recordUrl: string;
}

interface RoszdravnadzorTlsPolicy {
  ignoreHTTPSErrors: boolean;
  warning: string | null;
}

class ImporterDiagnosticError extends Error {
  readonly diagnosticsPath: string;

  constructor(message: string, diagnosticsPath: string) {
    super(message);
    this.name = "ImporterDiagnosticError";
    this.diagnosticsPath = diagnosticsPath;
  }
}

function resolveRoszdravnadzorTlsPolicy(
  environment: Readonly<Record<string, string | undefined>> = process.env,
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

function registrationNumberFromEntries(
  entries: ScalarEntry[],
  registrationNumber: string,
) {
  const target = normalizeRegistrationNumber(registrationNumber);
  return (
    entries.find(
      (entry) =>
        normalizeRegistrationNumber(entry.value) === target &&
        REGISTRATION_NUMBER_PATH_PATTERNS.some((pattern) =>
          pattern.test(entry.path),
        ),
    )?.value ?? null
  );
}

function registryRecordIdFromPayload(record: Record<string, unknown> | null) {
  if (!record) return null;
  const entries = collectScalarEntries(record);
  const prioritizedPatterns = [
    /(?:^|\.)(?:medProductId|med_product_id)$/i,
    /(?:^|\.)(?:productId|product_id)$/i,
    /(?:^|\.)(?:registryRecordId|recordId)$/i,
    /(?:^|\.)id$/i,
  ];
  return findValue(entries, prioritizedPatterns);
}

function findNetworkRegistryRecord(
  payloads: unknown[],
  registrationNumber: string,
): NetworkRegistryMatch | null {
  const queue: Array<{
    value: unknown;
    depth: number;
    payloadIndex: number;
    path: string;
  }> = payloads.map((value, payloadIndex) => ({
    value,
    depth: 0,
    payloadIndex,
    path: "$",
  }));
  let cursor = 0;
  let best:
    | {
        match: NetworkRegistryMatch;
        score: number;
      }
    | null = null;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    if (!current || current.depth > 9) continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) =>
        queue.push({
          value: item,
          depth: current.depth + 1,
          payloadIndex: current.payloadIndex,
          path: `${current.path}[${index}]`,
        }),
      );
      continue;
    }
    if (typeof current.value !== "object" || current.value === null) continue;
    const record = current.value as Record<string, unknown>;
    const entries = collectScalarEntries(record);
    const observed = registrationNumberFromEntries(entries, registrationNumber);
    if (observed) {
      const registryRecordId = registryRecordIdFromPayload(record);
      const fieldScore = [
        /medical.*device.*name|product.*name|наименован.*издел/i,
        /manufacturer|producer|производител/i,
        /status|state|статус/i,
        /issue.*date|registration.*date|updated.*date|modified.*date/i,
        /file|document|документ/i,
      ].filter((pattern) => entries.some((entry) => pattern.test(entry.path)))
        .length;
      // A logical record is normally the deepest compact object containing
      // the registration number and its sibling fields. Broad API envelopes
      // remain candidates, but lose to the contained record.
      const score =
        100 +
        fieldScore * 10 +
        (registryRecordId ? 20 : 0) +
        current.depth * 3 -
        Math.min(entries.length, 100);
      if (!best || score > best.score) {
        best = {
          score,
          match: {
            record,
            registrationNumber: observed,
            registryRecordId,
            payloadIndex: current.payloadIndex,
            path: current.path,
          },
        };
      }
    }
    Object.entries(record).forEach(([key, item]) =>
      queue.push({
        value: item,
        depth: current.depth + 1,
        payloadIndex: current.payloadIndex,
        path: `${current.path}.${key}`,
      }),
    );
  }
  return best?.match ?? null;
}

function findMatchingApiRecord(payloads: unknown[], registrationNumber: string) {
  return findNetworkRegistryRecord(payloads, registrationNumber)?.record ?? null;
}

function resolveRegistryAcquisition(input: {
  payloads: unknown[];
  registrationNumber: string;
  payloadUrls?: string[];
  domRecordUrl: string | null;
}): RegistryAcquisition | null {
  const networkMatch = findNetworkRegistryRecord(
    input.payloads,
    input.registrationNumber,
  );
  if (networkMatch) {
    const detailUrl = networkMatch.registryRecordId
      ? `${OFFICIAL_ORIGIN}/widget/med-product/${encodeURIComponent(
          networkMatch.registryRecordId,
        )}`
      : null;
    return {
      source: "network",
      record: networkMatch.record,
      registryRecordId: networkMatch.registryRecordId,
      recordUrl:
        detailUrl ??
        input.payloadUrls?.[networkMatch.payloadIndex] ??
        WIDGET_URL,
    };
  }
  if (!input.domRecordUrl) return null;
  return {
    source: "dom",
    record: null,
    registryRecordId: registryRecordIdFromUrl(input.domRecordUrl),
    recordUrl: input.domRecordUrl,
  };
}

const REGISTRATION_NUMBER_PATH_PATTERNS = [
  /registration.*number/i,
  /certificate.*number/i,
  /reg.*number/i,
  /(?:^|\.)noRu$/i,
  /(?:^|\.)numberRu$/i,
  /регистрац.*номер/i,
];
const REGISTRATION_NUMBER_LABEL_PATTERNS = [
  /регистрационн.*номер/i,
  /номер регистрационн/i,
];

function observedRegistrationNumber(rawRecord: RawRegistryRecord) {
  const matchingRecord = findMatchingApiRecord(
    rawRecord.payloads,
    rawRecord.registrationNumber,
  );
  const entries = collectScalarEntries(
    matchingRecord ?? rawRecord.payloads,
  );
  const domData =
    (rawRecord.metadata.domData as DomData | undefined) ?? {
      pairs: [],
      links: [],
    };
  return (
    findValue(entries, REGISTRATION_NUMBER_PATH_PATTERNS) ??
    valueFromDom(domData.pairs, REGISTRATION_NUMBER_LABEL_PATTERNS)
  );
}

function evaluateRegistrationEvidence(input: {
  query: string;
  observedRegistrationNumber: string | null;
  detailIdFallbackEnabled: boolean;
}) {
  if (!input.observedRegistrationNumber) {
    return input.detailIdFallbackEnabled
      ? {
          outcome: "unverified" as const,
          warning:
            "Manual detail fallback registration number could not be verified from DOM or observed JSON. Import may continue only with an explicit warning.",
        }
      : { outcome: "not_observed" as const, warning: null };
  }
  if (
    normalizeRegistrationNumber(input.observedRegistrationNumber) !==
    normalizeRegistrationNumber(input.query)
  ) {
    return {
      outcome: "mismatch" as const,
      warning:
        "The extracted registry record does not match the requested registration number. No ingestion plan or manifest was created.",
    };
  }
  return { outcome: "match" as const, warning: null };
}

function resolveDetailFallback(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const value = environment[DETAIL_ID_ENV]?.trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${DETAIL_ID_ENV} must contain an explicit numeric detail ID.`);
  }
  return {
    id: value,
    url: `${OFFICIAL_ORIGIN}/widget/med-product/${value}`,
    warning:
      "Manual Roszdravnadzor detail ID fallback was used. " +
      `${DETAIL_ID_ENV}=${value}. ` +
      "Widget search was intentionally skipped.",
  };
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

function scoreSearchDescriptor(input: {
  placeholder?: string | null;
  ariaLabel?: string | null;
  role?: string | null;
  name?: string | null;
  label?: string | null;
  className?: string | null;
}) {
  const placeholder = (input.placeholder ?? "").toLocaleLowerCase("ru-RU");
  const ariaLabel = (input.ariaLabel ?? "").toLocaleLowerCase("ru-RU");
  const role = (input.role ?? "").toLocaleLowerCase("ru-RU");
  const name = (input.name ?? "").toLocaleLowerCase("ru-RU");
  const label = (input.label ?? "").toLocaleLowerCase("ru-RU");
  const className = (input.className ?? "").toLocaleLowerCase("ru-RU");
  const terms = /регистрац|удостовер|(?:^|\s)ру(?:\s|$)|номер|поиск/iu;
  return (
    (terms.test(placeholder) ? 50 : 0) +
    (terms.test(ariaLabel) ? 45 : 0) +
    (terms.test(label) ? 40 : 0) +
    (/(?:^|\s)input-search(?:\s|$)/.test(className) ? 60 : 0) +
    (/searchbox|combobox|textbox/.test(role) ? 20 : 0) +
    (terms.test(name) ? 10 : 0)
  );
}

async function hasVisibleSearchButton(scope: SearchScopeLike) {
  const buttons = scope.locator('button, input[type="submit"], [role="button"]');
  const count = await buttons.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, 80); index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible().catch(() => false))) continue;
    const label = normalizeSpace(
      `${await button.innerText().catch(() => "")} ${
        (await button.getAttribute("value").catch(() => null)) ?? ""
      } ${
        (await button.getAttribute("aria-label").catch(() => null)) ?? ""
      }`,
    );
    if (
      !/расширенн.*поиск/i.test(label) &&
      /найти|поиск|искать|применить/i.test(label)
    ) {
      return true;
    }
  }
  return false;
}

async function findSearchInputInScope(scope: SearchScopeLike) {
  const inputs = scope.locator(
    'input, textarea, [role="searchbox"], [role="combobox"], [role="textbox"]',
  );
  const inputCount = await inputs.count();
  let selected: LocatorLike | null = null;
  let selectedScore = 0;

  for (let index = 0; index < Math.min(inputCount, 80); index += 1) {
    const input = inputs.nth(index);
    if (!(await input.isVisible().catch(() => false))) continue;
    const id = await input.getAttribute("id").catch(() => null);
    const escapedId = id?.replace(/["\\]/g, "\\$&") ?? "";
    const label = escapedId
      ? await scope
          .locator(`label[for="${escapedId}"]`)
          .innerText()
          .catch(() => "")
      : "";
    const score = scoreSearchDescriptor({
      placeholder: await input.getAttribute("placeholder").catch(() => null),
      ariaLabel: await input.getAttribute("aria-label").catch(() => null),
      role: await input.getAttribute("role").catch(() => null),
      name: await input.getAttribute("name").catch(() => null),
      className: await input.getAttribute("class").catch(() => null),
      label,
    });
    if (score > selectedScore) {
      selected = input;
      selectedScore = score;
    }
  }

  if (selected) return selected;
  if (await hasVisibleSearchButton(scope)) {
    for (let index = 0; index < Math.min(inputCount, 80); index += 1) {
      const input = inputs.nth(index);
      if (await input.isVisible().catch(() => false)) return input;
    }
  }
  return null;
}

async function findSearchInput(page: PageLike) {
  await page
    .waitForSelector(
      'input, textarea, [role="searchbox"], [role="combobox"], [role="textbox"]',
      { timeout: DOM_TIMEOUT_MS, state: "visible" },
    )
    .catch(() => undefined);
  const pageInput = await findSearchInputInScope(page);
  if (pageInput) return { input: pageInput, scope: page as SearchScopeLike };

  for (const frame of page.frames().slice(1)) {
    const frameInput = await findSearchInputInScope(frame).catch(() => null);
    if (frameInput) return { input: frameInput, scope: frame as SearchScopeLike };
  }
  throw new Error("Registration-number search input was not found.");
}

function isRegistryApiResponse(response: BrowserResponseLike) {
  const contentType = response.headers()["content-type"] ?? "";
  const resourceType = response.request?.().resourceType() ?? "";
  return (
    (contentType.includes("json") || /xhr|fetch/i.test(resourceType)) &&
    /med-product|registry|reestr|реестр/i.test(response.url())
  );
}

function networkMarkers(value: string, query: string) {
  const normalizedQuery = normalizeRegistrationNumber(query);
  return [
    ["ФСЗ", /ФСЗ/i],
    [
      normalizedQuery,
      normalizeRegistrationNumber(value).includes(normalizedQuery),
    ],
    ["med-product", /med-product/i],
    ["download-by-path-public", /download-by-path-public/i],
    ["files", /files/i],
  ].flatMap(([label, matcher]) =>
    (typeof matcher === "boolean"
      ? matcher
      : (matcher as RegExp).test(value))
      ? [label as string]
      : [],
  );
}

async function submitSearch(
  page: PageLike,
  registrationNumber: string,
  warnings: string[],
) {
  const { input, scope } = await findSearchInput(page);
  const responsePromise = page
    .waitForResponse(isRegistryApiResponse, { timeout: DOM_TIMEOUT_MS })
    .catch(() => null);
  await input.fill(registrationNumber);
  const clicked = await clickSearchButton(scope);
  if (!clicked) await input.press("Enter");
  const response = await responsePromise;
  if (!response) {
    warnings.push(
      "No registry JSON response was observed after search submission.",
    );
  }
  if (!clicked) {
    warnings.push("Search button was not found; Enter fallback was used.");
  }
}

async function clickSearchButton(scope: SearchScopeLike) {
  const buttons = scope.locator('button, input[type="submit"], [role="button"]');
  const count = await buttons.count();

  for (let index = 0; index < Math.min(count, 80); index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible().catch(() => false))) continue;
    const label = normalizeSpace(
      `${await button.innerText().catch(() => "")} ${
        (await button.getAttribute("value")) ?? ""
      } ${
        (await button.getAttribute("aria-label")) ?? ""
      }`,
    );
    const type = await button.getAttribute("type").catch(() => null);
    if (
      /расширенн.*поиск/i.test(label) ||
      (!/найти|поиск|искать|применить/i.test(label) && type !== "submit")
    ) {
      continue;
    }
    await button.click();
    return true;
  }
  return false;
}

async function findRegistryRecordUrl(
  page: PageLike,
  registrationNumber: string,
) {
  return page.evaluate(
    ({ expected }: { expected: string }) => {
      const normalize = (value: string) =>
        value
          .replace(/[№#]/g, "")
          .normalize("NFKC")
          .replace(/\s+/g, "")
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
  private readonly detailFallback: ReturnType<typeof resolveDetailFallback>;
  private readonly diagnosticsRootDirectory?: string;

  constructor(
    artifactStore: ContentAddressedArtifactStore,
    options: {
      environment?: Readonly<Record<string, string | undefined>>;
      diagnosticsRootDirectory?: string;
    } = {},
  ) {
    const environment = options.environment ?? process.env;
    this.artifactStore = artifactStore;
    this.downloader = new StreamingDownloader({ artifactStore });
    this.tlsPolicy = resolveRoszdravnadzorTlsPolicy(environment);
    this.detailFallback = resolveDetailFallback(environment);
    this.diagnosticsRootDirectory = options.diagnosticsRootDirectory;
    this.warnings = this.tlsPolicy.warning ? [this.tlsPolicy.warning] : [];
    if (this.detailFallback) this.warnings.push(this.detailFallback.warning);
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

    const networkDiagnostics: NetworkDiagnosticEntry[] = [];
    try {
      context = await browser.newContext({
        locale: "ru-RU",
        userAgent: BROWSER_USER_AGENT,
        ignoreHTTPSErrors: this.tlsPolicy.ignoreHTTPSErrors,
      });
      page = await context.newPage();
      const capturedPayloads: unknown[] = [];
      const capturedPayloadUrls: string[] = [];
      const jsonArtifacts: RawArtifact[] = [];
      const htmlArtifacts: RawArtifact[] = [];
      const pendingCaptures: Promise<void>[] = [];

      page.on("response", (response) => {
        if (pendingCaptures.length >= MAX_CAPTURED_JSON_RESPONSES) return;
        const capture = (async () => {
          const contentType = response.headers()["content-type"] ?? "";
          const resourceType = response.request?.().resourceType() ?? "unknown";
          const shouldPreview =
            contentType.includes("json") || /xhr|fetch/i.test(resourceType);
          let bytes: Buffer | null = null;
          let preview: string | null = null;
          if (shouldPreview) {
            bytes = await response.body().catch(() => null);
            preview = bytes?.toString("utf8").slice(0, 2_000) ?? null;
          }
          const searchable = `${response.url()} ${preview ?? ""}`;
          networkDiagnostics.push({
            url: response.url(),
            method: response.request?.().method() ?? "GET",
            status: response.status?.() ?? null,
            contentType,
            resourceType,
            bodyPreview: preview,
            markers: networkMarkers(searchable, query),
          });

          if (bytes && contentType.includes("json")) {
            try {
              const payload = JSON.parse(bytes.toString("utf8"));
              capturedPayloads.push(payload);
              capturedPayloadUrls.push(response.url());
              const markers = networkMarkers(searchable, query);
              if (
                /med-product|registry|reestr/i.test(response.url()) ||
                markers.includes(normalizeRegistrationNumber(query)) ||
                markers.includes("med-product")
              ) {
                jsonArtifacts.push(
                  await this.artifactStore.saveBytes({
                    kind: "registry-json",
                    sourceUrl: response.url(),
                    contentType: contentType || "application/json",
                    extension: ".json",
                    bytes,
                  }),
                );
              }
            } catch {
              this.warnings.push(
                `Registry JSON response could not be parsed: ${response.url()}; preview: ${
                  preview?.replace(/\s+/g, " ").slice(0, 300) ?? "unavailable"
                }`,
              );
            }
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

      const initialUrl = this.detailFallback?.url ?? WIDGET_URL;
      await page.goto(initialUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await page.waitForSelector("body", { timeout: DOM_TIMEOUT_MS });
      await page
        .waitForLoadState("networkidle", { timeout: DOM_TIMEOUT_MS })
        .catch(() => {
          this.warnings.push(
            "Initial page did not reach network idle before timeout.",
          );
        });
      const initialBlock = await detectTechnicalBlock(page);
      if (initialBlock) throw new Error(initialBlock);

      let registryRecordUrl: string | null = this.detailFallback?.url ?? null;
      let networkAcquisition: RegistryAcquisition | null = null;
      if (!this.detailFallback) {
        let searchFailure: unknown = null;
        try {
          await submitSearch(page, query, this.warnings);
        } catch (error) {
          searchFailure = error;
        }
        await Promise.allSettled(pendingCaptures);

        networkAcquisition = resolveRegistryAcquisition({
          payloads: capturedPayloads,
          payloadUrls: capturedPayloadUrls,
          registrationNumber: query,
          domRecordUrl: null,
        });
        if (networkAcquisition) {
          registryRecordUrl = networkAcquisition.recordUrl;
          this.warnings.push(
            "Registry record was extracted from a validated JSON/XHR response before DOM fallback.",
          );
        } else if (!searchFailure) {
          await page
            .waitForSelector('a[href*="/widget/med-product/"]', {
              timeout: DOM_TIMEOUT_MS,
            })
            .catch(() => {
              this.warnings.push(
                "Registry result link did not appear before timeout.",
              );
            });
          const domRecordUrl = await findRegistryRecordUrl(page, query);
          registryRecordUrl = resolveRegistryAcquisition({
            payloads: capturedPayloads,
            payloadUrls: capturedPayloadUrls,
            registrationNumber: query,
            domRecordUrl,
          })?.recordUrl ?? null;
        }
        if (!networkAcquisition) {
          const relevantInvalidResponses = networkDiagnostics.filter(
            (entry) =>
              /json/i.test(entry.contentType) ||
              /xhr|fetch/i.test(entry.resourceType),
          ).filter(
            (entry) =>
              entry.markers.includes("med-product") ||
              entry.markers.includes("ФСЗ") ||
              /med-product|registry|reestr/i.test(entry.url),
          );
          relevantInvalidResponses.forEach((entry) => {
            this.warnings.push(
              "Relevant registry response failed exact registration validation: " +
                `${entry.url}; preview: ${
                  entry.bodyPreview?.replace(/\s+/g, " ").slice(0, 300) ??
                  "unavailable"
                }`,
            );
          });
        }
        if (!registryRecordUrl) {
          if (searchFailure) throw searchFailure;
          throw new Error(
            "Registry record could not be extracted from DOM or observed network responses.",
          );
        }
      }
      if (!registryRecordUrl) {
        throw new Error("Registry record URL resolution failed.");
      }
      const resolvedRegistryRecordUrl = registryRecordUrl;

      if (resolvedRegistryRecordUrl !== page.url()) {
        try {
          await page.goto(resolvedRegistryRecordUrl, {
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
        } catch (error) {
          if (!networkAcquisition) throw error;
          this.warnings.push(
            "Validated network record was retained, but its optional detail " +
              `page could not be opened: ${
                error instanceof Error ? error.message : "unknown error"
              }`,
          );
        }
      }
      const block = await detectTechnicalBlock(page);
      if (block) throw new Error(block);

      await Promise.allSettled(pendingCaptures);
      const html = await page.content();
      htmlArtifacts.push(
        await this.artifactStore.saveBytes({
          kind: "registry-html",
          sourceUrl: resolvedRegistryRecordUrl,
          contentType: "text/html; charset=utf-8",
          extension: ".html",
          bytes: Buffer.from(html, "utf8"),
        }),
      );
      const domData = await collectDomData(page);
      const apiRecord = findMatchingApiRecord(capturedPayloads, query);

      const rawRecord: RawRegistryRecord = {
        provider: PROVIDER,
        query,
        registrationNumber: query,
        registryRecordId:
          this.detailFallback?.id ??
          networkAcquisition?.registryRecordId ??
          registryRecordIdFromUrl(resolvedRegistryRecordUrl) ??
          registryRecordIdFromPayload(apiRecord),
        sourceUrl: resolvedRegistryRecordUrl,
        capturedAt: new Date().toISOString(),
        payloads: capturedPayloads,
        htmlArtifacts,
        jsonArtifacts,
        metadata: {
          domData,
          detailIdFallbackEnabled: Boolean(this.detailFallback),
          acquisitionSource:
            networkAcquisition?.source ??
            (this.detailFallback ? "manual_detail" : "dom"),
        },
      };
      const registrationEvidence = evaluateRegistrationEvidence({
        query,
        observedRegistrationNumber: observedRegistrationNumber(rawRecord),
        detailIdFallbackEnabled: Boolean(this.detailFallback),
      });
      rawRecord.metadata.registrationEvidenceOutcome =
        registrationEvidence.outcome;
      if (registrationEvidence.outcome === "mismatch") {
        throw new Error(registrationEvidence.warning);
      }
      if (
        registrationEvidence.warning &&
        !this.warnings.includes(registrationEvidence.warning)
      ) {
        this.warnings.push(registrationEvidence.warning);
      }
      return rawRecord;
    } catch (error) {
      if (page && !isCertificateAuthorityError(error)) {
        const reason =
          error instanceof Error ? error.message : "Unknown browser failure.";
        const diagnosticsPath = await writeRoszdravnadzorDiagnostics({
          page,
          query,
          reason,
          tlsBypassEnabled: this.tlsPolicy.ignoreHTTPSErrors,
          detailIdFallbackEnabled: Boolean(this.detailFallback),
          network: networkDiagnostics,
          rootDirectory: this.diagnosticsRootDirectory,
        }).catch((diagnosticError) => {
          this.warnings.push(
            `Diagnostic capture failed: ${
              diagnosticError instanceof Error
                ? diagnosticError.message
                : "unknown error"
            }`,
          );
          return null;
        });
        if (diagnosticsPath) {
          throw new ImporterDiagnosticError(reason, diagnosticsPath);
        }
      }
      throw error;
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
    const entries = collectScalarEntries(apiRecord ?? rawRecord.payloads);
    const domData =
      (rawRecord.metadata.domData as DomData | undefined) ?? {
        pairs: [],
        links: [],
      };
    const registrationNumber =
      observedRegistrationNumber(rawRecord) ?? rawRecord.registrationNumber;

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
          /(?:^|\.)name$/i,
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
        findValue(entries, [
          /(?:^|\.)status\.name$/i,
          /(?:^|\.)status\.code$/i,
          /status/i,
          /state/i,
          /статус/i,
        ]) ??
        valueFromDom(domData.pairs, [/^статус/i]),
      issueDate:
        findValue(entries, [
          /issue.*date/i,
          /registration.*date/i,
          /date.*registration/i,
          /(?:^|\.)dateRu$/i,
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
          /(?:^|\.)updateDate$/i,
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
    // Registration number + exact source URL form the minimum normalized
    // identity. Missing descriptive fields remain explicit warnings and must
    // not leak an undocumented "partial" public output status.
    const normalizedRecordCreated = hasNormalizedIdentity;
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
      ...(error instanceof ImporterDiagnosticError
        ? { diagnosticsPath: error.diagnosticsPath }
        : {}),
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
  const registrationEvidence = evaluateRegistrationEvidence({
    query,
    observedRegistrationNumber: observedRegistrationNumber(rawRecord),
    detailIdFallbackEnabled:
      rawRecord.metadata.detailIdFallbackEnabled === true,
  });
  if (registrationEvidence.outcome === "mismatch") {
    return {
      normalizedRecord: null,
      ingestionPlan: null,
      manifestPath: null,
      downloadedArtifactPaths: [],
      status: "blocked",
      warnings: [
        ...adapter.warnings,
        registrationEvidence.warning,
      ],
    };
  }
  if (registrationEvidence.warning) {
    if (!adapter.warnings.includes(registrationEvidence.warning)) {
      adapter.warnings.push(registrationEvidence.warning);
    }
  }
  const initialPlan = await adapter.createIngestionPlan(
    rawRecord,
    normalizedRecord,
  );
  const merged = await manifestStore.merge(initialPlan);
  const finalStatus = determineImportStatus({
    registryRecordFound: true,
    normalizedRecordCreated: Boolean(
      normalizedRecord.registrationNumber && normalizedRecord.sourceUrl,
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
    status:
      finalPlan.status === "completed" && finalPlan.warnings.length > 0
        ? "completed_with_warnings"
        : finalPlan.status,
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
  evaluateRegistrationEvidence,
  findMatchingApiRecord,
  findNetworkRegistryRecord,
  findSearchInputInScope,
  normalizeDocumentLinks,
  normalizeRegistrationNumber,
  observedRegistrationNumber,
  resolveRegistryAcquisition,
  resolveDetailFallback,
  resolveRoszdravnadzorTlsPolicy,
  runImport,
  scoreSearchDescriptor,
};
