import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface DiagnosticLocatorLike {
  count(): Promise<number>;
  nth(index: number): DiagnosticLocatorLike;
  isVisible(): Promise<boolean>;
  getAttribute(name: string): Promise<string | null>;
  innerText(): Promise<string>;
  boundingBox(): Promise<
    { x: number; y: number; width: number; height: number } | null
  >;
  evaluate<TResult>(callback: (element: Element) => TResult): Promise<TResult>;
}

export interface DiagnosticFrameLike {
  url(): string;
  name(): string;
  locator(selector: string): DiagnosticLocatorLike;
  frameElement?(): Promise<DiagnosticLocatorLike>;
}

export interface DiagnosticPageLike {
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  locator(selector: string): DiagnosticLocatorLike;
  frames(): DiagnosticFrameLike[];
  screenshot?(options: { path: string; fullPage: boolean }): Promise<unknown>;
  evaluate<TResult>(callback: () => TResult): Promise<TResult>;
}

export interface NetworkDiagnosticEntry {
  url: string;
  method: string;
  status: number | null;
  contentType: string;
  resourceType: string;
  bodyPreview: string | null;
  markers: string[];
}

export interface DiagnosticMetadata {
  url: string;
  title: string;
  timestamp: string;
  query: string;
  status: "blocked";
  reason: string;
  userAgent: string;
  tlsBypassEnabled: boolean;
  detailIdFallbackEnabled: boolean;
  diagnosticsVersion: "1.0";
}

const ELEMENT_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  '[role="button"]',
  '[role="searchbox"]',
  '[role="combobox"]',
].join(",");

async function inspectElements(scope: {
  locator(selector: string): DiagnosticLocatorLike;
}) {
  const locator = scope.locator(ELEMENT_SELECTOR);
  const count = await locator.count().catch(() => 0);
  const elements = [];
  for (let index = 0; index < Math.min(count, 500); index += 1) {
    const element = locator.nth(index);
    const isVisible = await element.isVisible().catch(() => false);
    if (!isVisible) continue;
    elements.push({
      tag: await element
        .evaluate((node) => node.tagName.toLocaleLowerCase())
        .catch(() => null),
      type: await element.getAttribute("type").catch(() => null),
      textContent: await element.innerText().catch(() => ""),
      placeholder: await element.getAttribute("placeholder").catch(() => null),
      ariaLabel: await element.getAttribute("aria-label").catch(() => null),
      name: await element.getAttribute("name").catch(() => null),
      id: await element.getAttribute("id").catch(() => null),
      className: await element.getAttribute("class").catch(() => null),
      href: await element.getAttribute("href").catch(() => null),
      role: await element.getAttribute("role").catch(() => null),
      isVisible,
      boundingBox: await element.boundingBox().catch(() => null),
    });
  }
  return elements;
}

export async function writeRoszdravnadzorDiagnostics(input: {
  page: DiagnosticPageLike;
  query: string;
  reason: string;
  tlsBypassEnabled: boolean;
  detailIdFallbackEnabled: boolean;
  network: NetworkDiagnosticEntry[];
  rootDirectory?: string;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  const directoryName = timestamp.replace(/[:.]/g, "-");
  const diagnosticsPath = join(
    input.rootDirectory ??
      resolve(process.cwd(), "tmp/roszdravnadzor/diagnostics"),
    directoryName,
  );
  await mkdir(diagnosticsPath, { recursive: true });

  const screenshotPath = join(diagnosticsPath, "screenshot.png");
  if (input.page.screenshot) {
    await input.page
      .screenshot({ path: screenshotPath, fullPage: true })
      .catch(() => writeFile(screenshotPath, Buffer.alloc(0)));
  } else {
    await writeFile(screenshotPath, Buffer.alloc(0));
  }

  const html = await input.page.content().catch(() => "");
  const visibleText = await input.page
    .locator("body")
    .innerText()
    .catch(() => "");
  const elements = await inspectElements(input.page);
  const iframes = [];
  for (const frame of input.page.frames().slice(1)) {
    const frameElement = await frame.frameElement?.().catch(() => null);
    iframes.push({
      url: frame.url(),
      name: frame.name(),
      title:
        (await frameElement?.getAttribute("title").catch(() => null)) ?? null,
      detectedElements: await inspectElements(frame).catch(() => []),
    });
  }
  const userAgent = await input.page
    .evaluate(() => navigator.userAgent)
    .catch(() => "unavailable");
  const metadata: DiagnosticMetadata = {
    url: input.page.url(),
    title: await input.page.title().catch(() => ""),
    timestamp,
    query: input.query,
    status: "blocked",
    reason: input.reason,
    userAgent,
    tlsBypassEnabled: input.tlsBypassEnabled,
    detailIdFallbackEnabled: input.detailIdFallbackEnabled,
    diagnosticsVersion: "1.0",
  };

  await Promise.all([
    writeFile(join(diagnosticsPath, "page.html"), html, "utf8"),
    writeFile(join(diagnosticsPath, "visible-text.txt"), visibleText, "utf8"),
    writeFile(
      join(diagnosticsPath, "elements.json"),
      `${JSON.stringify(elements, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      join(diagnosticsPath, "iframes.json"),
      `${JSON.stringify(iframes, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      join(diagnosticsPath, "network.json"),
      `${JSON.stringify(input.network, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      join(diagnosticsPath, "metadata.json"),
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    ),
  ]);

  return diagnosticsPath;
}
