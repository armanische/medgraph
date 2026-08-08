import { createHash } from "node:crypto";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

type CorrectiveSpecification = Readonly<{
  group: string;
  items: ReadonlyArray<Readonly<{
    name: string;
    value: string;
    unit?: string;
  }>>;
}>;

type CorrectiveProduct = Readonly<{
  name: string;
  manufacturer: string;
  model: string;
  cyber_category: string;
  candidate_slug: string;
  short_description: string;
  full_description: string;
  key_features: string[];
  specifications: CorrectiveSpecification[];
  seo_title: string;
  seo_description: string;
  application_areas: string[];
  presentation: Readonly<{
    applicationAreaTags: string[];
    featureSectionTitle: string;
    showFeatureSection: boolean;
    hideCountryWhenMissing: boolean;
    catalogShowSpecifications: boolean;
  }>;
}>;

type Corrective = Readonly<{
  version: number;
  products: CorrectiveProduct[];
}>;

type MediaAsset = Readonly<{
  productSlug: string;
  sourcePageUrl: string;
  sourceMediaUrl: string;
  localPath: string;
  alt: string;
  role: "hero" | "gallery";
  sha256: string;
  bytes: number;
  contentType: string;
  match: "exact_model_context" | "product_page_family";
}>;

type StageProduct = {
  id: string;
  sourceUid: string;
  slug: string;
  title: string;
  model: string;
  seoTitle: string;
  seoDescription: string;
  shortDescription: string;
  description: string;
  manufacturerId: string;
  categoryId: string;
  publicationStatus: string;
  published: boolean;
  reviewState: string;
  updatedAt: string;
  createdAt: string;
  applicationAreas: Array<{ id: string; name: string }>;
  keyFeatures: Array<{ text: string; sortOrder: number }>;
  characteristicGroups: Array<{
    key: string;
    title: string;
    sortOrder: number;
    items: Array<{ label: string; value: string; unit: string | null; sortOrder: number }>;
  }>;
  media: Array<{ url: string; role: "hero" | "gallery"; format: string; alt: string }>;
  stageImport: {
    entityOrigin: "new_candidate" | "existing_duplicate";
    sourceName: string;
    sourceUrl: string;
    sourceUid: string;
    productId: string;
  };
  [key: string]: unknown;
};

type StageSnapshot = {
  schemaVersion: number;
  generatedAt: string;
  products: StageProduct[];
  summary: Record<string, number>;
  [key: string]: unknown;
};

type StageAudit = {
  counts: Record<string, number>;
  products: Array<Record<string, unknown> & { slug: string; mediaCount: number }>;
  duplicateBindings: Array<{
    sourceCandidateSlug: string;
    productId: string;
  }>;
  [key: string]: unknown;
};

type MediaManifest = {
  schemaVersion: number;
  generatedAt: string;
  assets: MediaAsset[];
  [key: string]: unknown;
};

const ROOT = resolve(process.cwd());
const SNAPSHOT_PATH = resolve(ROOT, "data/import/endomarket-wave1-stage-catalog.json");
const AUDIT_PATH = resolve(ROOT, "data/import/endomarket-wave1-audit.json");
const MANIFEST_PATH = resolve(ROOT, "data/import/endomarket-wave1-media-manifest.json");
const MEDIA_ROOT = resolve(ROOT, "public/media/endomarket-wave1");
const CORRECTIVE_PATH = resolve(
  ROOT,
  "data/import/source/endomarket-business-content-corrective-v2.json",
);
const CSV_PATH = resolve(ROOT, "data/import/source/endomarket-text-replacements-v2.csv");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function parseCsv(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.replace(/\r$/u, ""));
    rows.push(row);
  }
  assert(!quoted, "Corrective CSV has an unterminated quoted field");
  return rows;
}

function validateCsv(corrective: Corrective, csvText: string) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/u, ""));
  const header = rows[0] ?? [];
  const expectedHeader = [
    "product",
    "model",
    "short_description_v2",
    "full_description_v2",
    "feature_section_title",
    "features_v2",
    "show_feature_section",
    "application_tags_v2",
    "hide_country_when_missing",
    "catalog_show_specifications",
  ];
  assert(JSON.stringify(header) === JSON.stringify(expectedHeader), "Corrective CSV header drift");
  assert(rows.length === 43, "Corrective CSV must contain exactly 42 Product rows");
  const productsByModel = new Map(corrective.products.map((product) => [product.model, product]));
  for (const columns of rows.slice(1)) {
    assert(columns.length === expectedHeader.length, `Corrective CSV column drift for ${columns[1]}`);
    const product = productsByModel.get(columns[1]!);
    assert(product, `Corrective CSV has an unknown model: ${columns[1]}`);
    assert(columns[0] === product.name, `Corrective CSV Product name drift: ${product.model}`);
    assert(columns[2] === product.short_description, `Corrective CSV short description drift: ${product.model}`);
    assert(columns[3] === product.full_description, `Corrective CSV full description drift: ${product.model}`);
    assert(columns[4] === product.presentation.featureSectionTitle, `Corrective CSV section title drift: ${product.model}`);
    assert(
      columns[5] === product.key_features.join(" | "),
      `Corrective CSV key feature drift: ${product.model}`,
    );
    assert(
      columns[6] === (product.presentation.showFeatureSection ? "Да" : "Нет"),
      `Corrective CSV section visibility drift: ${product.model}`,
    );
    assert(
      columns[7] === product.presentation.applicationAreaTags.join(" | "),
      `Corrective CSV application tags drift: ${product.model}`,
    );
    assert(columns[8] === "Да", `Corrective CSV country policy drift: ${product.model}`);
    assert(columns[9] === "Нет", `Corrective CSV catalog specification policy drift: ${product.model}`);
  }
}

function characteristicGroups(product: CorrectiveProduct) {
  const groups: StageProduct["characteristicGroups"] = [{
    key: "general",
    title: "Основные сведения",
    sortOrder: 0,
    items: [
      { label: "Производитель", value: product.manufacturer, unit: null, sortOrder: 0 },
      { label: "Модель", value: product.model, unit: null, sortOrder: 1 },
      { label: "Категория", value: product.cyber_category, unit: null, sortOrder: 2 },
    ],
  }];
  for (const [groupIndex, group] of product.specifications.entries()) {
    const seen = new Set<string>();
    const items = group.items.flatMap((item, itemIndex) => {
      const key = `${item.name.trim().toLocaleLowerCase("ru-RU")}:${item.value.trim().toLocaleLowerCase("ru-RU")}`;
      if (!item.name.trim() || !item.value.trim() || seen.has(key)) return [];
      seen.add(key);
      return [{
        label: item.name.trim(),
        value: item.value.trim(),
        unit: item.unit?.trim() || null,
        sortOrder: itemIndex,
      }];
    });
    if (items.length > 0) groups.push({
      key: `source-${groupIndex + 1}`,
      title: group.group.trim() || "Характеристики",
      sortOrder: groupIndex + 1,
      items,
    });
  }
  return groups;
}

function isWatermarkedSource(url: string) {
  return /\.(?:1200x1200|420x400)w\./iu.test(new URL(url).pathname);
}

function cleanMedia(assets: readonly MediaAsset[], productsBySlug: ReadonlyMap<string, StageProduct>) {
  const watermarkedAssets = assets.filter((asset) => isWatermarkedSource(asset.sourceMediaUrl));
  const candidates = assets.filter((asset) => !isWatermarkedSource(asset.sourceMediaUrl));
  const clean: MediaAsset[] = [];
  const duplicateAssets: MediaAsset[] = [];
  const byProduct = new Map<string, MediaAsset[]>();
  for (const asset of candidates) {
    const group = byProduct.get(asset.productSlug) ?? [];
    group.push(asset);
    byProduct.set(asset.productSlug, group);
  }
  for (const [productSlug, productAssets] of byProduct) {
    const product = productsBySlug.get(productSlug);
    assert(product, `Media references unknown Product slug: ${productSlug}`);
    const seenDigests = new Set<string>();
    for (const asset of productAssets) {
      if (seenDigests.has(asset.sha256)) {
        duplicateAssets.push(asset);
        continue;
      }
      seenDigests.add(asset.sha256);
      const position = seenDigests.size - 1;
      clean.push({
        ...asset,
        role: position === 0 ? "hero" : "gallery",
        alt: `${product.title}, изображение ${position + 1}`,
      });
    }
  }
  return { clean, duplicateAssets, watermarkedAssets };
}

async function main() {
  const [snapshotText, auditText, manifestText, correctiveText, csvText] = await Promise.all([
    readFile(SNAPSHOT_PATH, "utf8"),
    readFile(AUDIT_PATH, "utf8"),
    readFile(MANIFEST_PATH, "utf8"),
    readFile(CORRECTIVE_PATH, "utf8"),
    readFile(CSV_PATH, "utf8"),
  ]);
  const snapshot = JSON.parse(snapshotText) as StageSnapshot;
  const audit = JSON.parse(auditText) as StageAudit;
  const manifest = JSON.parse(manifestText) as MediaManifest;
  const corrective = JSON.parse(correctiveText) as Corrective;

  assert(corrective.version === 2, "Business/content corrective version drift");
  assert(corrective.products.length === 42, "Business/content corrective must contain exactly 42 Products");
  assert(new Set(corrective.products.map(({ candidate_slug }) => candidate_slug)).size === 42, "Corrective Product slug collision");
  assert(new Set(corrective.products.map(({ model }) => model)).size === 42, "Corrective Product model collision");
  validateCsv(corrective, csvText);

  const candidates = snapshot.products.filter(
    ({ stageImport }) => stageImport.entityOrigin === "new_candidate",
  );
  assert(candidates.length === 42, "Stage snapshot candidate scope drift");
  const candidatesBySlug = new Map(candidates.map((product) => [product.slug, product]));
  for (const correction of corrective.products) {
    const product = candidatesBySlug.get(correction.candidate_slug);
    assert(product, `Corrective Product is missing from Stage: ${correction.candidate_slug}`);
    assert(product.model === correction.model, `Corrective Product model drift: ${correction.candidate_slug}`);
    assert(correction.presentation.featureSectionTitle === "Ключевые особенности", `Unexpected feature section title: ${correction.model}`);
    assert(correction.presentation.hideCountryWhenMissing, `Country policy must fail closed: ${correction.model}`);
    assert(!correction.presentation.catalogShowSpecifications, `Catalog specifications must be hidden: ${correction.model}`);

    product.title = correction.name;
    product.seoTitle = correction.seo_title;
    product.seoDescription = correction.seo_description;
    product.shortDescription = correction.short_description;
    product.description = correction.full_description;
    product.applicationAreas = correction.presentation.applicationAreaTags.map((name, index) => ({
      id: `${correction.candidate_slug}-area-${index + 1}`,
      name,
    }));
    product.keyFeatures = correction.presentation.showFeatureSection
      ? correction.key_features.map((text, sortOrder) => ({ text, sortOrder }))
      : [];
    product.characteristicGroups = characteristicGroups(correction);
  }

  const productsBySlug = new Map(snapshot.products.map((product) => [product.slug, product]));
  const productsByMediaSlug = new Map(productsBySlug);
  const mediaSlugByProductId = new Map(snapshot.products.map((product) => [product.id, product.slug]));
  for (const binding of audit.duplicateBindings) {
    const product = snapshot.products.find(({ id }) => id === binding.productId);
    assert(product, `Duplicate media binding references unknown Product: ${binding.productId}`);
    productsByMediaSlug.set(binding.sourceCandidateSlug, product);
    mediaSlugByProductId.set(product.id, binding.sourceCandidateSlug);
  }
  const mediaResult = cleanMedia(manifest.assets, productsByMediaSlug);
  const cleanMediaByProduct = new Map<string, MediaAsset[]>();
  for (const asset of mediaResult.clean) {
    const values = cleanMediaByProduct.get(asset.productSlug) ?? [];
    values.push(asset);
    cleanMediaByProduct.set(asset.productSlug, values);
  }
  for (const product of snapshot.products) {
    const mediaSlug = mediaSlugByProductId.get(product.id) ?? product.slug;
    product.media = (cleanMediaByProduct.get(mediaSlug) ?? []).map((asset) => ({
      url: asset.localPath,
      role: asset.role,
      format: asset.contentType,
      alt: asset.alt,
    }));
  }

  const cleanPaths = new Set(mediaResult.clean.map(({ localPath }) => localPath));
  const diskFiles = await readdir(MEDIA_ROOT);
  const removedFiles: string[] = [];
  for (const fileName of diskFiles) {
    const publicPath = `/media/endomarket-wave1/${fileName}`;
    if (cleanPaths.has(publicPath)) continue;
    await rm(resolve(MEDIA_ROOT, fileName));
    removedFiles.push(publicPath);
  }

  const hiddenFeatureSections = corrective.products.filter(
    ({ presentation }) => !presentation.showFeatureSection,
  ).length;
  const previousCorrective = audit.businessContentCorrective as undefined | {
    version?: number;
    media?: {
      watermarkedAssignmentsRemoved?: number;
      watermarkedFilesRemoved?: number;
      duplicateAssignmentsRemoved?: number;
      duplicateFilesRemoved?: number;
    };
  };
  const uniqueMediaAssets = new Set(mediaResult.clean.map(({ sha256: digest }) => digest)).size;
  const mediaAssignments = mediaResult.clean.length;
  const newWatermarkedFilesRemoved = new Set(
    mediaResult.watermarkedAssets.map(({ localPath }) => localPath),
  ).size;
  const newDuplicateFilesRemoved = new Set(
    mediaResult.duplicateAssets.map(({ localPath }) => localPath),
  ).size;
  const watermarkedFilesRemoved = newWatermarkedFilesRemoved ||
    (previousCorrective?.version === 2 ? previousCorrective.media?.watermarkedFilesRemoved ?? 0 : 0);
  const duplicateFilesRemoved = newDuplicateFilesRemoved ||
    (previousCorrective?.version === 2 ? previousCorrective.media?.duplicateFilesRemoved ?? 0 : 0);
  const watermarkedAssignmentsRemoved = mediaResult.watermarkedAssets.length ||
    (previousCorrective?.version === 2 ? previousCorrective.media?.watermarkedAssignmentsRemoved ?? 0 : 0);
  const duplicateAssignmentsRemoved = mediaResult.duplicateAssets.length ||
    (previousCorrective?.version === 2 ? previousCorrective.media?.duplicateAssignmentsRemoved ?? 0 : 0);
  assert(watermarkedFilesRemoved === 67, "Watermarked media classification drift");
  assert(
    removedFiles.length === newWatermarkedFilesRemoved + newDuplicateFilesRemoved,
    "Unexpected media file cleanup scope",
  );
  assert(mediaResult.clean.every(({ sourceMediaUrl }) => !isWatermarkedSource(sourceMediaUrl)), "Watermarked media survived cleanup");
  assert(hiddenFeatureSections === 12, "Hidden Product Detail feature section count drift");

  snapshot.summary = {
    ...snapshot.summary,
    mediaAssignments,
    uniqueMediaAssets,
    watermarkedMediaRemoved: watermarkedFilesRemoved,
    duplicateMediaRemoved: duplicateFilesRemoved,
    hiddenFeatureSections,
  };
  audit.counts = snapshot.summary;
  audit.products = audit.products.map((product) => ({
    ...product,
    mediaCount: productsBySlug.get(product.slug)?.media.length ?? 0,
  }));
  audit.businessContentCorrective = {
    version: corrective.version,
    productCount: corrective.products.length,
    hiddenFeatureSections,
    sourceFiles: [
      { fileName: basename(CORRECTIVE_PATH), sha256: sha256(correctiveText) },
      { fileName: basename(CSV_PATH), sha256: sha256(csvText) },
    ],
    csvJsonConsistency: "pass",
    media: {
      watermarkPolicy: "responsive source variants ending in w were visually verified as EM/EndoMarket watermarked",
      watermarkedAssignmentsRemoved,
      watermarkedFilesRemoved,
      duplicateAssignmentsRemoved,
      duplicateFilesRemoved,
      cleanAssignments: mediaAssignments,
      cleanUniqueAssets: uniqueMediaAssets,
    },
  };
  manifest.assets = mediaResult.clean;
  manifest.businessContentCorrective = {
    version: corrective.version,
    watermarkedFilesRemoved,
    duplicateFilesRemoved,
  };

  await Promise.all([
    writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`),
    writeFile(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`),
    writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`),
  ]);

  console.info(JSON.stringify({
    event: "endomarket_business_content_corrective_v2_applied",
    productsCorrected: corrective.products.length,
    hiddenFeatureSections,
    mediaAssignments,
    uniqueMediaAssets,
    watermarkedAssignmentsRemoved,
    watermarkedFilesRemoved,
    duplicateAssignmentsRemoved,
    duplicateFilesRemoved,
  }));
}

await main();
