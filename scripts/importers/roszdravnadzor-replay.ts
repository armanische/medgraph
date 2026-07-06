import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface ReplayElement {
  tag?: string | null;
  type?: string | null;
  textContent?: string | null;
  placeholder?: string | null;
  ariaLabel?: string | null;
  name?: string | null;
  id?: string | null;
  role?: string | null;
  isVisible?: boolean;
}

interface ReplayFrame {
  url?: string;
  name?: string;
  title?: string | null;
  detectedElements?: ReplayElement[];
}

interface ReplayNetworkEntry {
  url?: string;
  contentType?: string;
  resourceType?: string;
  bodyPreview?: string | null;
  markers?: string[];
}

interface ReplayMetadata {
  url?: string;
  title?: string;
  timestamp?: string;
  query?: string;
  status?: string;
  reason?: string;
  userAgent?: string;
  tlsBypassEnabled?: boolean;
  detailIdFallbackEnabled?: boolean;
  diagnosticsVersion?: string;
}

async function readJson<T>(directory: string, name: string): Promise<T> {
  return JSON.parse(await readFile(join(directory, name), "utf8")) as T;
}

function descriptor(element: ReplayElement) {
  return [
    element.tag,
    element.type,
    element.textContent,
    element.placeholder,
    element.ariaLabel,
    element.name,
    element.id,
    element.role,
  ]
    .filter(Boolean)
    .join(" ");
}

function isSearchInput(element: ReplayElement) {
  const value = descriptor(element);
  return (
    element.isVisible !== false &&
    (/input|textarea/i.test(element.tag ?? "") ||
      /searchbox|combobox|textbox/i.test(element.role ?? "")) &&
    /регистрац|удостовер|(?:^|\s)ру(?:\s|$)|номер|поиск|search/i.test(value)
  );
}

function isSearchButton(element: ReplayElement) {
  const value = descriptor(element);
  return (
    element.isVisible !== false &&
    (/button/i.test(element.tag ?? "") ||
      /button/i.test(element.role ?? "") ||
      element.type === "submit") &&
    /найти|поиск|искать|применить|search|submit/i.test(value)
  );
}

function selectorStrategies(elements: ReplayElement[]) {
  const strategies = new Set<string>();
  for (const element of elements.filter(isSearchInput)) {
    if (element.placeholder) {
      strategies.add(
        `placeholder: ${JSON.stringify(element.placeholder.slice(0, 120))}`,
      );
    }
    if (element.ariaLabel) {
      strategies.add(
        `aria-label: ${JSON.stringify(element.ariaLabel.slice(0, 120))}`,
      );
    }
    if (element.role) strategies.add(`role: ${element.role}`);
    if (element.name) strategies.add(`name: ${element.name}`);
    if (element.id) strategies.add(`id: #${element.id}`);
  }
  return [...strategies];
}

export async function replayRoszdravnadzorDiagnostics(inputPath: string) {
  const directory = resolve(inputPath);
  const [metadata, elements, iframes, network] = await Promise.all([
    readJson<ReplayMetadata>(directory, "metadata.json"),
    readJson<ReplayElement[]>(directory, "elements.json"),
    readJson<ReplayFrame[]>(directory, "iframes.json"),
    readJson<ReplayNetworkEntry[]>(directory, "network.json"),
  ]);
  const frameElements = iframes.flatMap(
    (frame) => frame.detectedElements ?? [],
  );
  const allElements = [...elements, ...frameElements];
  const inputs = allElements.filter(isSearchInput);
  const buttons = allElements.filter(isSearchButton);
  const jsonOrXhr = network.filter(
    (entry) =>
      /json/i.test(entry.contentType ?? "") ||
      /xhr|fetch/i.test(entry.resourceType ?? ""),
  );
  const searchableNetwork = (entry: ReplayNetworkEntry) =>
    `${entry.url ?? ""} ${entry.bodyPreview ?? ""} ${(entry.markers ?? []).join(
      " ",
    )}`;
  const medProductResponses = jsonOrXhr.filter((entry) =>
    /med-product|ФСЗ|2009\/04992/i.test(searchableNetwork(entry)),
  );
  const downloadResponses = network.filter((entry) =>
    /download-by-path-public/i.test(searchableNetwork(entry)),
  );
  const strategies = selectorStrategies(allElements);

  let recommendation =
    "Inspect page.html and visible-text.txt, then update provider selectors.";
  if (medProductResponses.length) {
    recommendation =
      "Prefer the observed med-product JSON/XHR response and verify the registration number before DOM fallback.";
  } else if (inputs.length && buttons.length) {
    recommendation =
      "Replay the listed input/button strategy against the current widget DOM.";
  } else if (iframes.length) {
    recommendation =
      "Inspect the captured iframe metadata and run search detection inside the accessible frame.";
  } else if (!metadata.detailIdFallbackEnabled) {
    recommendation =
      "Obtain an explicit detail ID from an operator and retry with ROSRZN_DETAIL_ID; do not guess the ID.";
  }

  const lines = [
    "Roszdravnadzor diagnostics replay",
    `URL: ${metadata.url ?? "unknown"}`,
    `Title: ${metadata.title ?? "unknown"}`,
    `Query: ${metadata.query ?? "unknown"}`,
    `Status: ${metadata.status ?? "unknown"}`,
    `Reason: ${metadata.reason ?? "unknown"}`,
    `Diagnostics version: ${metadata.diagnosticsVersion ?? "legacy"}`,
    `TLS bypass: ${metadata.tlsBypassEnabled ? "enabled" : "disabled"}`,
    `Detail ID fallback: ${
      metadata.detailIdFallbackEnabled ? "enabled" : "disabled"
    }`,
    `Search inputs found: ${inputs.length}`,
    `Search buttons found: ${buttons.length}`,
    `Iframes found: ${iframes.length}`,
    `JSON/XHR/fetch responses: ${jsonOrXhr.length}`,
    `Responses mentioning med-product/registration: ${medProductResponses.length}`,
    `Responses mentioning download-by-path-public: ${downloadResponses.length}`,
    "Selector strategies:",
    ...(strategies.length
      ? strategies.map((strategy) => `- ${strategy}`)
      : ["- none detected"]),
    `Recommended next action: ${recommendation}`,
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const inputPath = process.argv.slice(2).join(" ").trim();
  if (!inputPath) {
    throw new Error(
      "Pass diagnostics directory: npm run replay:roszdravnadzor -- tmp/roszdravnadzor/diagnostics/<timestamp>",
    );
  }
  process.stdout.write(await replayRoszdravnadzorDiagnostics(inputPath));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Replay failed."}\n`,
    );
    process.exitCode = 1;
  });
}
