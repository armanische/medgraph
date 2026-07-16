import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  PublicationAuditIssue,
  PublicationAuditResult,
  PublishedCatalog,
  PublishedProduct,
  PublicationBuildResult,
} from "./types.ts";

function duplicateValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

function inspectPublicStrings(value: unknown, path: string, issues: PublicationAuditIssue[]) {
  if (typeof value === "string") {
    if (/^(?:file:\/\/|[a-zA-Z]:\\|\/Users\/|\/home\/|\/var\/|\/tmp\/)/u.test(value)) {
      issues.push({ code: "absolute_path", message: `Absolute path at ${path}.`, path });
    }
    if (/data\/research|scripts\/importers|reviewItemId|documentVersionId|evidenceCandidateId/iu.test(value)) {
      issues.push({ code: "internal_reference", message: `Internal reference at ${path}.`, path });
    }
    if (/\.json(?:$|[?#])/iu.test(value)) {
      issues.push({ code: "internal_json_link", message: `JSON link at ${path}.`, path });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectPublicStrings(entry, `${path}[${index}]`, issues));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      inspectPublicStrings(entry, `${path}.${key}`, issues);
    }
  }
}

function validateProduct(product: PublishedProduct, issues: PublicationAuditIssue[]) {
  const path = `products.${product.slug}`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(product.slug)) {
    issues.push({ code: "invalid_slug", message: `Invalid product slug ${product.slug}.`, path });
  }
  if (!product.documents.length || !product.sources.length) {
    issues.push({ code: "missing_evidence", message: `${product.slug} has no public evidence chain.`, path });
  }
  const sourceUrls = new Set(product.sources.map((source) => source.url));
  for (const document of product.documents) {
    if (!sourceUrls.has(document.url)) {
      issues.push({
        code: "broken_link",
        message: `${product.slug} document has no matching source.`,
        path,
      });
    }
    try {
      const url = new URL(document.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
    } catch {
      issues.push({ code: "broken_link", message: `Invalid document URL for ${product.slug}.`, path });
    }
  }
}

export function validatePublishedCatalog(catalog: PublishedCatalog): PublicationAuditResult {
  const issues: PublicationAuditIssue[] = [];
  for (const id of duplicateValues(catalog.products.map((product) => product.id))) {
    issues.push({ code: "duplicate_id", message: `Duplicate product id ${id}.` });
  }
  for (const slug of duplicateValues(catalog.products.map((product) => product.slug))) {
    issues.push({ code: "duplicate_slug", message: `Duplicate product slug ${slug}.` });
  }
  for (const product of catalog.products) validateProduct(product, issues);

  const productSlugs = new Set(catalog.products.map((product) => product.slug));
  for (const entry of [...catalog.manufacturers, ...catalog.categories]) {
    for (const slug of entry.productSlugs) {
      if (!productSlugs.has(slug)) {
        issues.push({ code: "orphan_publication", message: `${entry.slug} references missing product ${slug}.` });
      }
    }
  }
  for (const entry of catalog.knowledge) {
    if (!productSlugs.has(entry.productSlug)) {
      issues.push({ code: "orphan_publication", message: `Knowledge ${entry.slug} is orphaned.` });
    }
  }
  if (catalog.knowledge.length !== catalog.products.length) {
    issues.push({ code: "orphan_publication", message: "Knowledge and product counts differ." });
  }
  inspectPublicStrings(catalog, "catalog", issues);
  return { valid: issues.length === 0, issues, kpi: catalog.kpi };
}

async function listJsonBasenames(directory: string) {
  try {
    return (await readdir(directory))
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -5))
      .sort();
  } catch {
    return [];
  }
}

export async function auditPublishedCatalog(
  publicRoot: string,
  expectedCatalog?: PublishedCatalog,
  expectedManifest?: PublicationBuildResult["internalManifest"],
): Promise<PublicationAuditResult> {
  const summary = JSON.parse(
    await readFile(join(publicRoot, "summary.generated.json"), "utf8"),
  ) as PublishedCatalog;
  const result = validatePublishedCatalog(summary);
  const issues = [...result.issues];
  const directories = [
    ["products", summary.products.map((entry) => entry.slug)],
    ["manufacturers", summary.manufacturers.map((entry) => entry.slug)],
    ["categories", summary.categories.map((entry) => entry.slug)],
    ["knowledge", summary.knowledge.map((entry) => entry.slug)],
  ] as const;
  for (const [directory, expected] of directories) {
    const actual = await listJsonBasenames(join(publicRoot, directory));
    if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
      issues.push({
        code: "orphan_publication",
        message: `${directory} files do not match summary index.`,
        path: directory,
      });
    }
  }
  if (expectedCatalog && JSON.stringify(summary) !== JSON.stringify(expectedCatalog)) {
    issues.push({
      code: "stale_publication",
      message: "Published catalog does not match current eligible Review Queue records.",
    });
  }
  try {
    const manifest = JSON.parse(
      await readFile(join(publicRoot, "publication-manifest.internal.json"), "utf8"),
    ) as PublicationBuildResult["internalManifest"];
    const publicSlugs = new Set(summary.products.map((product) => product.slug));
    const manifestSlugs = manifest.products.map((product) => product.productSlug);
    if (duplicateValues(manifestSlugs).length || manifestSlugs.some((slug) => !publicSlugs.has(slug))) {
      issues.push({ code: "orphan_publication", message: "Approval manifest contains an orphan or duplicate product." });
    }
    if (expectedManifest && JSON.stringify(manifest) !== JSON.stringify(expectedManifest)) {
      issues.push({ code: "stale_publication", message: "Approval manifest does not match current approvals." });
    }
    inspectPublicStrings(manifest, "internalManifest", issues);
  } catch {
    issues.push({ code: "missing_approval_manifest", message: "Internal approval manifest is missing or invalid." });
  }
  return { valid: issues.length === 0, issues, kpi: summary.kpi };
}
