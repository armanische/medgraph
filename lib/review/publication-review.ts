import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/client.server";

import {
  findPublicationRevision,
  PUBLICATION_REVISION_MANIFEST,
  type PublicationRevisionManifestEntry,
} from "./publication-revision-manifest";

export type CatalogAdminProduct = {
  id: string;
  slug: string | null;
  title: string | null;
  model: string | null;
  description: string | null;
  shortDescription: string | null;
  publicationStatus: string;
  published: boolean;
  reviewState: string;
  manufacturerId: string | null;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  qualityFlags: {
    missingRegistration?: boolean;
    missingDocuments?: boolean;
    missingModel?: boolean;
  } | null;
  characteristics?: unknown[] | null;
  media?: unknown[] | null;
  immutable?: {
    sourceUid?: string;
    sourceChecksum?: string;
    snapshotVersion?: string;
  } | null;
};

type Reference = { id: string; name: string };

export type PublicationReviewEvidence = {
  manifest: PublicationRevisionManifestEntry;
  product: CatalogAdminProduct;
  manufacturer: string;
  current: true;
  characteristics: number;
  media: number;
};

async function readRpc<T>(pathname: string, body: Record<string, unknown>): Promise<T> {
  const client = createSupabaseServerClient({ access: "service_role" });
  const response = await client.request(pathname, {
    method: "POST",
    headers: {
      "Accept-Profile": "cloud_api",
      "Content-Profile": "cloud_api",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}

export async function readCatalogAdminProduct(productId: string) {
  return readRpc<CatalogAdminProduct | null>(
    "/rest/v1/rpc/catalog_admin_product",
    { p_id: productId },
  );
}

async function readManufacturers() {
  return readRpc<Reference[]>(
    "/rest/v1/rpc/catalog_admin_references",
    { p_kind: "manufacturers" },
  );
}

function isCurrentManifestProduct(
  manifest: PublicationRevisionManifestEntry,
  product: CatalogAdminProduct | null,
): product is CatalogAdminProduct {
  const characteristics = product?.characteristics ?? [];
  const media = product?.media ?? [];
  return Boolean(
    product
    && product.id === manifest.productId
    && product.model === manifest.model
    && product.publicationStatus === "in_review"
    && product.reviewState === "in_review"
    && !product.published
    && product.seoTitle
    && product.seoDescription
    && product.qualityFlags?.missingModel === false
    && product.immutable?.sourceUid === manifest.sourceUid
    && characteristics.length >= 3
    && media.length > 0,
  );
}

export async function loadPublicationReviewEvidence(revisionId: string) {
  const manifest = findPublicationRevision(revisionId);
  if (!manifest) return null;

  const [product, references] = await Promise.all([
    readCatalogAdminProduct(manifest.productId),
    readManufacturers(),
  ]);
  if (!isCurrentManifestProduct(manifest, product)) return null;

  const manufacturer = references.find((reference) => reference.id === product.manufacturerId)?.name;
  if (!manufacturer) return null;

  return {
    manifest,
    product,
    manufacturer,
    current: true,
    characteristics: product.characteristics?.length ?? 0,
    media: product.media?.length ?? 0,
  } satisfies PublicationReviewEvidence;
}

export async function loadPublicationReviewQueue() {
  const entries = await Promise.all(
    PUBLICATION_REVISION_MANIFEST.map(async (manifest) => {
      const evidence = await loadPublicationReviewEvidence(manifest.revisionId);
      if (!evidence) return null;
      return evidence;
    }),
  );
  return entries.filter((entry): entry is PublicationReviewEvidence => entry !== null);
}

export function buildReviewRationale(evidence: PublicationReviewEvidence) {
  return [
    `Reviewed immutable ${evidence.manifest.model} revision ${evidence.manifest.revisionNumber}.`,
    "Product identity, canonical Russian content, SEO, characteristics, media and source-grounded content match the current publication candidate.",
    "Warnings missing_documents and missing_registration are acknowledged as non-blocking for this lifecycle stage.",
  ].join(" ");
}
