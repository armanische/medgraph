import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

type InputSpecification = Readonly<{
  group: string;
  items: ReadonlyArray<Readonly<{
    name: string;
    value: string;
    unit?: string;
  }>>;
}>;

type InputProduct = Readonly<{
  name: string;
  manufacturer: string;
  model: string;
  source_category: string;
  source_url: string;
  source_card_name: string;
  cyber_category: string;
  action: "new" | "duplicate_confirmed" | "duplicate_likely";
  priority: string;
  duplicate_note: string;
  candidate_slug: string;
  availability_label: string;
  installment_label: string;
  installment_description: string;
  short_description: string;
  full_description: string;
  key_features: string[];
  specifications: InputSpecification[];
  media_count: number | null;
  publication_status: string;
  source_name: string;
  seo_title: string;
  seo_description: string;
  application_areas: string[];
}>;

type ImportPackage = Readonly<{
  generatedAt: string;
  source: Readonly<{ name: string; baseUrl: string }>;
  summary: Readonly<{
    normalizedEquipmentRows: number;
    newCandidates: number;
    duplicatesConfirmedOrLikely: number;
    excludedInstrumentRows: number;
    excludedNonEquipmentConsumables: number;
  }>;
  products: InputProduct[];
  duplicateReview: InputProduct[];
  excluded: unknown[];
}>;

type SourcePage = Readonly<{
  url: string;
  status: number;
  sha256: string;
  html: string;
  productMediaUrls: ReadonlyArray<Readonly<{ url: string; offset: number }>>;
}>;

type MediaRecord = Readonly<{
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

const EXPECTED = Object.freeze({
  normalized: 51,
  candidates: 42,
  duplicates: 9,
  instruments: 76,
  consumables: 3,
});

const COMMERCIAL_PRESENTATION = Object.freeze({
  source: "endomarket" as const,
  availabilityStatus: "in_stock" as const,
  availabilityLabel: "В наличии",
  installmentEnabled: true,
  installmentLabel: "Рассрочка 0%",
  installmentTermMonths: 12,
  installmentDescription: "До 12 месяцев без удорожания",
});

const EXISTING_DUPLICATES = Object.freeze({
  "sonoscape-hd-350": {
    productId: "721a2244-75a6-42b3-9370-7df148d8a51e",
    sourceUid: "776712772161",
    slug: "767632362-776712772161-videoendoskopicheskaya-sistema-sonoscape",
    title: "Видеопроцессор SonoScape HD-350",
    canonicalModel: "HD-350",
    evidence: "published_product_detail",
  },
  "sonoscape-hd-500": {
    productId: "831f5d47-a765-4bc2-8d18-65691cae76e9",
    sourceUid: "697047413241",
    slug: "767632362-697047413241-videoendoskopicheskaya-sistema-sonoscape",
    title: "Видеопроцессор SonoScape HD-500",
    canonicalModel: "HD-500",
    evidence: "published_product_detail",
  },
  "sonoscape-hd-550": {
    productId: deterministicUuid("existing:sonoscape:hd-550"),
    sourceUid: "catalog-seed-videoendoskopicheskaya-sistema-sonoscape-hd-550",
    slug: "videoendoskopicheskaya-sistema-sonoscape-hd-550",
    title: "Видеоэндоскопическая система SonoScape HD-550",
    canonicalModel: "HD-550",
    evidence: "repository_catalog_seed",
  },
  "olympus-exera-iii": {
    productId: "4e1a370b-4e53-4ee6-b590-823d1ad0e087",
    sourceUid: "304432044232",
    slug: "767632362-304432044232-videoendoskopicheskaya-sistema-olympus-c",
    title: "Видеоэндоскопическая система Olympus EVIS EXERA III CV-190",
    canonicalModel: "CV-190",
    evidence: "published_product_detail",
  },
  "olympus-optera": {
    productId: "95af806c-3fbf-446e-a608-263aa290d548",
    sourceUid: "740658724462",
    slug: "767632362-740658724462-videoendoskopicheskaya-sistema-olympus-c",
    title: "Видеоэндоскопическая система Olympus CV-170",
    canonicalModel: "CV-170",
    evidence: "published_product_detail",
  },
  "olympus-axeon": {
    productId: "5143084e-5fe7-4094-bf8c-6cd8197b741e",
    sourceUid: "403689762041",
    slug: "767632362-403689762041-videoendoskopicheskaya-sistema-olympus-a",
    title: "Видеоэндоскопическая система Olympus AXEON",
    canonicalModel: "AXEON",
    evidence: "published_product_detail",
  },
  "pentax-epk-i7010-optivista": {
    productId: "860306a1-e01e-4f10-b980-93490e446d37",
    sourceUid: "529970599662",
    slug: "pentax-epk-i7010-optivista",
    title: "Видеопроцессор PENTAX Medical EPK-i7010 OPTIVISTA",
    canonicalModel: "EPK-i7010 OPTIVISTA",
    evidence: "tracked_corrective_report",
  },
  "pentax-epk-i5000": {
    productId: "48f7d071-c8e4-4bc9-96c4-fc12672ca183",
    sourceUid: "446510199362",
    slug: "767632362-446510199362-videoendoskopicheskaya-sistema-pentax-ep",
    title: "Видеопроцессор PENTAX Medical EPK-i5000",
    canonicalModel: "EPK-i5000",
    evidence: "published_product_detail",
  },
  "pentax-epk-3000-defina": {
    productId: "ec3d6459-264c-43f6-841c-b092c7abeb06",
    sourceUid: "670271281172",
    slug: "767632362-670271281172-videoendoskopicheskaya-sistema-epk-3000",
    title: "Видеоэндоскопический процессор PENTAX Medical EPK-3000 DEFINA",
    canonicalModel: "EPK-3000 DEFINA",
    evidence: "published_product_detail",
  },
} as const);

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function deterministicUuid(value: string) {
  const hex = sha256(value).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function identifier(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || `ref-${sha256(value).slice(0, 12)}`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gu, "&")
    .replace(/&#x2F;/giu, "/")
    .replace(/&#47;/gu, "/");
}

async function fetchWithRetry(url: string) {
  let finalError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "CyberMedica-Stage-Importer/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      finalError = error;
      if (attempt < 2) await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * (attempt + 1)));
    }
  }
  throw finalError;
}

function sourceMediaUrls(html: string) {
  const values: Array<{ url: string; offset: number }> = [];
  const pattern = /(?:https:\/\/endomarket\.ru)?\/files\/products\/[a-z0-9_+,.?=&%()\-\/]+/giu;
  for (const match of html.matchAll(pattern)) {
    const raw = decodeHtml(match[0]);
    values.push({
      url: new URL(raw, "https://endomarket.ru").toString(),
      offset: match.index ?? 0,
    });
  }
  return [...new Map(values.map((item) => [item.url, item])).values()];
}

async function fetchSourcePage(url: string): Promise<SourcePage> {
  const response = await fetchWithRetry(url);
  assert(response.ok, `EndoMarket source returned HTTP ${response.status}: ${url}`);
  assert(new URL(response.url).hostname === "endomarket.ru", `Unexpected source redirect: ${url}`);
  const html = await response.text();
  assert(html.length > 1_000, `EndoMarket source response is unexpectedly empty: ${url}`);
  return {
    url,
    status: response.status,
    sha256: sha256(html),
    html,
    productMediaUrls: sourceMediaUrls(html),
  };
}

function chooseMedia(product: InputProduct, page: SourcePage) {
  const isProductPage = new URL(page.url).pathname.startsWith("/products/");
  const modelOffset = page.html.toLocaleLowerCase("ru-RU").indexOf(
    product.model.toLocaleLowerCase("ru-RU"),
  );
  if (isProductPage) {
    return page.productMediaUrls.slice(0, Math.min(product.media_count ?? 4, 4)).map((media) => ({
      ...media,
      match: "product_page_family" as const,
    }));
  }
  if (modelOffset === -1) return [];
  return [...page.productMediaUrls]
    .sort((left, right) => Math.abs(left.offset - modelOffset) - Math.abs(right.offset - modelOffset))
    .slice(0, 1)
    .map((media) => ({ ...media, match: "exact_model_context" as const }));
}

function resolveProductDetailUrl(product: InputProduct, page: SourcePage) {
  if (new URL(product.source_url).pathname.startsWith("/products/")) return product.source_url;
  const loweredHtml = page.html.toLocaleLowerCase("ru-RU");
  const modelOffset = [product.model, product.source_card_name, product.name]
    .map((value) => loweredHtml.indexOf(value.toLocaleLowerCase("ru-RU")))
    .find((offset) => offset >= 0) ?? -1;
  if (modelOffset === -1) return null;
  const links: Array<{ url: string; offset: number }> = [];
  const pattern = /(?:https:\/\/endomarket\.ru)?\/?products\/[a-z0-9-]+/giu;
  for (const match of page.html.matchAll(pattern)) {
    links.push({
      url: new URL(match[0], "https://endomarket.ru").toString(),
      offset: match.index ?? 0,
    });
  }
  const closest = links.sort(
    (left, right) => Math.abs(left.offset - modelOffset) - Math.abs(right.offset - modelOffset),
  )[0];
  return closest && Math.abs(closest.offset - modelOffset) <= 12_000 ? closest.url : null;
}

function imageExtension(contentType: string, url: string) {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  const fromPath = extname(new URL(url).pathname).toLowerCase();
  return [".png", ".webp", ".gif", ".jpg", ".jpeg"].includes(fromPath) ? fromPath : ".jpg";
}

async function downloadMedia(
  product: InputProduct,
  selected: ReturnType<typeof chooseMedia>,
  sourcePageUrl: string,
  publicRoot: string,
  cache: Map<string, Omit<MediaRecord, "productSlug" | "sourcePageUrl" | "match" | "alt" | "role">>,
): Promise<MediaRecord[]> {
  const records: MediaRecord[] = [];
  for (const [position, media] of selected.entries()) {
    let shared = cache.get(media.url);
    if (!shared) {
      const response = await fetchWithRetry(media.url);
      assert(response.ok, `EndoMarket media returned HTTP ${response.status}`);
      assert(new URL(response.url).hostname === "endomarket.ru", "Unexpected media redirect host");
      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
      assert(contentType.startsWith("image/"), `EndoMarket media is not an image: ${media.url}`);
      const body = new Uint8Array(await response.arrayBuffer());
      assert(body.byteLength > 500 && body.byteLength <= 8 * 1024 * 1024, "EndoMarket media size is invalid");
      const digest = sha256(body);
      const fileName = `${digest.slice(0, 24)}${imageExtension(contentType, media.url)}`;
      const diskPath = resolve(publicRoot, fileName);
      await mkdir(dirname(diskPath), { recursive: true });
      await writeFile(diskPath, body);
      shared = {
        sourceMediaUrl: media.url,
        localPath: `/media/endomarket-wave1/${fileName}`,
        sha256: digest,
        bytes: body.byteLength,
        contentType,
      };
      cache.set(media.url, shared);
    }
    records.push({
      productSlug: product.candidate_slug,
      sourcePageUrl,
      ...shared,
      alt: `${product.name}, изображение ${position + 1}`,
      role: position === 0 ? "hero" : "gallery",
      match: media.match,
    });
  }
  return records;
}

function cleanDescription(product: InputProduct) {
  const specific = !/представленн(?:ый|ая|ое) в каталоге EndoMarket/iu.test(product.full_description);
  if (specific) return product.full_description.trim();
  const features = product.key_features.filter(Boolean);
  return [
    product.short_description.trim(),
    features.length > 0 ? `Ключевые возможности: ${features.join("; ").replace(/; ([^;]+)$/u, "; $1")}.` : "",
  ].filter(Boolean).join(" ");
}

function cleanSeoTitle(product: InputProduct) {
  return product.seo_title
    .replace(/\s*[—-]\s*купить\s*/iu, " — ")
    .replace(/\s*\|\s*CyberMedica\s*$/iu, " | CyberMedica")
    .trim();
}

function baseCharacteristics(product: InputProduct) {
  return [
    { label: "Производитель", value: product.manufacturer, unit: null },
    { label: "Модель", value: product.model, unit: null },
    { label: "Категория", value: product.cyber_category, unit: null },
  ];
}

function characteristicGroups(product: InputProduct) {
  const groups: Array<{
    key: string;
    title: string;
    sortOrder: number;
    items: Array<{ label: string; value: string; unit: string | null; sortOrder: number }>;
  }> = [{
    key: "general",
    title: "Основные сведения",
    sortOrder: 0,
    items: baseCharacteristics(product).map((item, sortOrder) => ({ ...item, sortOrder })),
  }];
  product.specifications.forEach((group, groupIndex) => {
    const seen = new Set<string>();
    const items = group.items.flatMap((item, itemIndex) => {
      const key = `${item.name.trim().toLowerCase()}:${item.value.trim().toLowerCase()}`;
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
  });
  return groups;
}

function referenceRows(values: string[], generatedAt: string, kind: "manufacturer" | "category") {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "ru-RU")).map((name, index) => ({
    id: identifier(name),
    slug: identifier(name),
    name,
    description: kind === "manufacturer"
      ? `Оборудование производителя ${name}.`
      : `Медицинское оборудование категории «${name}».`,
    ...(kind === "manufacturer" ? { countryCode: null, website: null } : { position: index }),
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }));
}

function makeProductRow(
  product: InputProduct,
  generatedAt: string,
  media: MediaRecord[],
  duplicate: (typeof EXISTING_DUPLICATES)[keyof typeof EXISTING_DUPLICATES] | null,
) {
  const slug = duplicate?.slug ?? product.candidate_slug;
  const productId = duplicate?.productId ?? deterministicUuid(`endomarket:${product.manufacturer}:${product.model}`);
  const sourceUid = duplicate?.sourceUid ?? `endomarket-${sha256(`${product.source_url}:${product.model}`).slice(0, 20)}`;
  const title = duplicate?.title ?? product.name;
  const model = duplicate?.canonicalModel ?? product.model;
  return {
    id: productId,
    sourceUid,
    slug,
    title,
    model,
    seoTitle: cleanSeoTitle({ ...product, name: title, model }),
    seoDescription: product.short_description.trim(),
    shortDescription: product.short_description.trim(),
    description: cleanDescription(product),
    manufacturerId: identifier(product.manufacturer === "Pentax" ? "PENTAX Medical" : product.manufacturer),
    categoryId: identifier(product.cyber_category),
    publicationStatus: duplicate ? "published" : "draft",
    published: Boolean(duplicate),
    reviewState: duplicate ? "published" : "pending",
    updatedAt: generatedAt,
    createdAt: generatedAt,
    applicationAreas: product.application_areas.map((name, index) => ({
      id: `${identifier(product.candidate_slug)}-area-${index + 1}`,
      name,
    })),
    keyFeatures: product.key_features.map((text, sortOrder) => ({ text, sortOrder })),
    characteristicGroups: characteristicGroups(product),
    media: media.map((item) => ({
      url: item.localPath,
      role: item.role,
      format: item.contentType,
      alt: item.alt,
    })),
    documents: [],
    registrations: [],
    commercialPresentation: COMMERCIAL_PRESENTATION,
    stageImport: {
      entityOrigin: duplicate ? "existing_duplicate" : "new_candidate",
      sourceName: "EndoMarket",
      sourceUrl: product.source_url,
      sourceUid,
      productId,
    },
  };
}

async function main() {
  const inputPath = option("--input");
  assert(inputPath, "Usage: --input <endomarket import package.json>");
  const outputRoot = resolve(option("--output-root") ?? "data/import");
  const publicRoot = resolve(option("--media-root") ?? "public/media/endomarket-wave1");
  assert(publicRoot.endsWith("/public/media/endomarket-wave1"), "Media output root must be the tracked EndoMarket directory");
  const parsed = JSON.parse(await readFile(resolve(inputPath), "utf8")) as ImportPackage;
  assert(parsed.summary.normalizedEquipmentRows === EXPECTED.normalized, "Normalized equipment count drift");
  assert(parsed.summary.newCandidates === EXPECTED.candidates, "New candidate count drift");
  assert(parsed.summary.duplicatesConfirmedOrLikely === EXPECTED.duplicates, "Duplicate count drift");
  assert(parsed.summary.excludedInstrumentRows === EXPECTED.instruments, "Instrument exclusion count drift");
  assert(parsed.summary.excludedNonEquipmentConsumables === EXPECTED.consumables, "Consumable exclusion count drift");
  assert(parsed.products.length === EXPECTED.candidates, "Product scope must contain exactly 42 candidates");
  assert(parsed.duplicateReview.length === EXPECTED.duplicates, "Duplicate scope must contain exactly nine entries");
  const allInput = [...parsed.products, ...parsed.duplicateReview];
  assert(new Set(parsed.products.map(({ candidate_slug }) => candidate_slug)).size === EXPECTED.candidates, "Duplicate candidate slug");
  assert(new Set(allInput.map(({ candidate_slug }) => candidate_slug)).size === EXPECTED.normalized, "Normalized scope slug collision");
  assert(parsed.duplicateReview.every(({ candidate_slug }) => candidate_slug in EXISTING_DUPLICATES), "Unbound duplicate entry");

  await rm(publicRoot, { recursive: true, force: true });
  const pages = new Map<string, SourcePage>();
  for (const url of [...new Set(allInput.map(({ source_url }) => source_url))]) {
    pages.set(url, await fetchSourcePage(url));
  }
  const resolvedSourceUrl = new Map<string, string>();
  for (const product of allInput) {
    const detailUrl = resolveProductDetailUrl(product, pages.get(product.source_url)!);
    resolvedSourceUrl.set(product.candidate_slug, detailUrl ?? product.source_url);
  }
  for (const url of [...new Set(resolvedSourceUrl.values())]) {
    if (!pages.has(url)) pages.set(url, await fetchSourcePage(url));
  }
  const mediaCache = new Map<string, Omit<MediaRecord, "productSlug" | "sourcePageUrl" | "match">>();
  const mediaRecords: MediaRecord[] = [];
  const productMedia = new Map<string, MediaRecord[]>();
  for (const product of allInput) {
    const pageUrl = resolvedSourceUrl.get(product.candidate_slug)!;
    const page = pages.get(pageUrl)!;
    const downloaded = await downloadMedia(
      product,
      chooseMedia(product, page),
      pageUrl,
      publicRoot,
      mediaCache,
    );
    mediaRecords.push(...downloaded);
    productMedia.set(product.candidate_slug, downloaded);
  }

  const generatedAt = new Date(parsed.generatedAt).toISOString();
  const manufacturers = referenceRows(
    allInput.map(({ manufacturer }) => manufacturer === "Pentax" ? "PENTAX Medical" : manufacturer),
    generatedAt,
    "manufacturer",
  );
  const categories = referenceRows(allInput.map(({ cyber_category }) => cyber_category), generatedAt, "category");
  const candidateRows = parsed.products.map((product) => makeProductRow(
    product,
    generatedAt,
    productMedia.get(product.candidate_slug) ?? [],
    null,
  ));
  const duplicateRows = parsed.duplicateReview.map((product) => makeProductRow(
    product,
    generatedAt,
    productMedia.get(product.candidate_slug) ?? [],
    EXISTING_DUPLICATES[product.candidate_slug as keyof typeof EXISTING_DUPLICATES],
  ));
  const products = [...duplicateRows, ...candidateRows];
  assert(products.filter(({ stageImport }) => stageImport.entityOrigin === "new_candidate").length === 42, "Candidate output drift");
  assert(products.filter(({ stageImport }) => stageImport.entityOrigin === "existing_duplicate").length === 9, "Duplicate output drift");
  assert(new Set(products.map(({ id }) => id)).size === 51, "Product ID collision");
  assert(new Set(products.map(({ slug }) => slug)).size === 51, "Product slug collision");

  const uniqueMediaAssets = new Set(mediaRecords.map(({ sha256: digest }) => digest)).size;
  const snapshot = {
    schemaVersion: 1,
    source: "endomarket_stage_preview",
    generatedAt,
    products,
    manufacturers,
    categories,
    applicationAreas: [],
    summary: {
      normalizedEquipmentRows: 51,
      newDraftCandidates: 42,
      existingDuplicateBindings: 9,
      excludedInstrumentRows: 76,
      excludedNonEquipmentConsumables: 3,
      mediaAssignments: mediaRecords.length,
      uniqueMediaAssets,
    },
  };
  const audit = {
    schemaVersion: 1,
    generatedAt,
    source: parsed.source,
    input: {
      fileName: basename(inputPath),
      sha256: sha256(await readFile(resolve(inputPath))),
    },
    counts: snapshot.summary,
    duplicateBindings: parsed.duplicateReview.map((product) => ({
      sourceCandidateSlug: product.candidate_slug,
      sourceModel: product.model,
      ...EXISTING_DUPLICATES[product.candidate_slug as keyof typeof EXISTING_DUPLICATES],
      candidateCreated: false,
      commercialMetadataMerged: true,
    })),
    exclusions: {
      instruments: 76,
      nonEquipmentConsumables: 3,
      excludedFromStageProducts: true,
    },
    sourcePages: [...pages.values()].map(({ html, productMediaUrls, ...page }) => {
      void html;
      return {
        ...page,
        discoveredProductMedia: productMediaUrls.length,
      };
    }),
    resolvedProductPages: allInput.map((product) => ({
      productSlug: product.candidate_slug,
      sourceUrl: product.source_url,
      resolvedProductUrl: resolvedSourceUrl.get(product.candidate_slug),
    })),
    products: products.map((product) => ({
      productId: product.id,
      sourceUid: product.sourceUid,
      slug: product.slug,
      model: product.model,
      manufacturerId: product.manufacturerId,
      categoryId: product.categoryId,
      entityOrigin: product.stageImport.entityOrigin,
      mediaCount: product.media.length,
      publicationStatus: product.publicationStatus,
    })),
    safety: {
      productionCredentialsUsed: false,
      productionWrites: 0,
      lifecycleWrites: 0,
      migrations: 0,
      publicApiAdded: false,
    },
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, "endomarket-wave1-stage-catalog.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  await writeFile(resolve(outputRoot, "endomarket-wave1-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
  await writeFile(resolve(outputRoot, "endomarket-wave1-media-manifest.json"), `${JSON.stringify({
    schemaVersion: 1,
    generatedAt,
    assets: mediaRecords,
  }, null, 2)}\n`);
  console.info(JSON.stringify({
    event: "endomarket_stage_catalog_generated",
    products: products.length,
    newDraftCandidates: 42,
    duplicateBindings: 9,
    mediaAssignments: mediaRecords.length,
    uniqueMediaAssets,
    snapshotSha256: sha256(JSON.stringify(snapshot)),
  }));
}

await main();
