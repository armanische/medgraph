import "server-only";

import { createServerSupabaseClient } from "./supabase-projection.ts";
import type {
  PublicProductClaim,
  PublicProductCharacteristic,
  PublicProductPage,
  PublicProductPublicationEvent,
  PublicProductSource,
} from "./types.ts";

export type ProductPageLoadResult =
  | { status: "success"; product: PublicProductPage }
  | { status: "not-found" }
  | { status: "error"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function parseCharacteristics(value: unknown): PublicProductCharacteristic[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = readString(item, "label");
    const itemValue = readString(item, "value");
    return label && itemValue ? [{ label, value: itemValue }] : [];
  });
}

function readStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function parseClaims(value: unknown): PublicProductClaim[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const scope = readRecord(item, "scope");
    const code = readString(item, "code");
    const displayName = readString(item, "displayName");
    const formattedValue = readString(item, "formattedValue");
    const publicationKey = readString(item, "publicationKey");
    const sourceId = readString(item, "sourceId");
    const scopeSummary = scope && readString(scope, "summary");
    const appliesTo = scope ? readStringArray(scope, "appliesTo") : [];
    const limitations = readStringArray(item, "limitations");

    if (
      !code ||
      !displayName ||
      !formattedValue ||
      !publicationKey ||
      !sourceId ||
      !scopeSummary
    ) {
      return [];
    }

    return [
      {
        code,
        displayName,
        formattedValue,
        publicationKey,
        sourceId,
        scope: { summary: scopeSummary, appliesTo },
        limitations,
      },
    ];
  });
}

function parseSources(value: unknown): PublicProductSource[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const id = readString(item, "id");
    const source = readRecord(item, "source");
    const document = readRecord(item, "document");
    const documentVersion = readRecord(item, "documentVersion");
    const evidence = readRecord(item, "evidence");
    const verification = readRecord(item, "verification");
    const publication = readRecord(item, "publication");

    if (
      !source ||
      !document ||
      !documentVersion ||
      !evidence ||
      !verification ||
      !publication
    ) {
      return [];
    }

    const sourceName = readString(source, "name");
    const sourceType = readString(source, "type");
    const documentTitle = readString(document, "title");
    const documentType = readString(document, "type");
    const documentUrl = readString(document, "url");
    const documentVersionLabel = readString(documentVersion, "label");
    const evidenceLocator = readString(evidence, "locator");
    const evidenceExcerpt = readString(evidence, "excerpt");
    const verificationStatus = readString(verification, "status");
    const verifiedAt = readString(verification, "verifiedAt");
    const publicationStatus = readString(publication, "status");
    const publishedAt = readString(publication, "publishedAt");
    const publicKey = readString(publication, "publicKey");

    if (
      !id ||
      !sourceName ||
      !sourceType ||
      !documentTitle ||
      !documentType ||
      !documentUrl ||
      !documentVersionLabel ||
      !evidenceLocator ||
      !evidenceExcerpt ||
      !verificationStatus ||
      !verifiedAt ||
      !publicationStatus ||
      !publishedAt ||
      !publicKey
    ) {
      return [];
    }

    return [
      {
        id,
        source: { name: sourceName, type: sourceType },
        document: {
          title: documentTitle,
          type: documentType,
          url: documentUrl,
        },
        documentVersion: { label: documentVersionLabel },
        evidence: { locator: evidenceLocator, excerpt: evidenceExcerpt },
        verification: { status: verificationStatus, verifiedAt },
        publication: { status: publicationStatus, publishedAt, publicKey },
      },
    ];
  });
}

function parsePublicationHistory(
  value: unknown,
): PublicProductPublicationEvent[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const event = readString(item, "event");
    const effectiveAt = readString(item, "effectiveAt");
    const title = readString(item, "title");
    const description = readString(item, "description");
    const publicationKey = readString(item, "publicationKey");

    return event && effectiveAt && title && description && publicationKey
      ? [{ event, effectiveAt, title, description, publicationKey }]
      : [];
  });
}

function parseProduct(payload: unknown): PublicProductPage | null {
  if (!isRecord(payload)) return null;

  const registration = payload.registration;
  const publication = payload.publication;
  const heroImage = payload.heroImage;

  if (
    !isRecord(registration) ||
    !isRecord(publication) ||
    !isRecord(heroImage)
  ) {
    return null;
  }

  const slug = readString(payload, "slug");
  const name = readString(payload, "name");
  const manufacturer = readString(payload, "manufacturer");
  const category = readString(payload, "category");
  const description = readString(payload, "description");
  const heroImageSrc = readString(heroImage, "src");
  const heroImageAlt = readString(heroImage, "alt");
  const registrationNumber = readString(registration, "number");
  const registrationStatus = readString(registration, "status");
  const publicationStatus = readString(publication, "status");
  const publishedAt = readString(publication, "publishedAt");
  const verifiedAt = readString(publication, "verifiedAt");
  const keySummary = Array.isArray(payload.keySummary)
    ? payload.keySummary.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim()),
      )
    : [];

  if (
    !slug ||
    !name ||
    !manufacturer ||
    !category ||
    !description ||
    !heroImageSrc ||
    !heroImageAlt ||
    !registrationNumber ||
    !registrationStatus ||
    !publicationStatus ||
    !publishedAt ||
    !verifiedAt
  ) {
    return null;
  }

  return {
    slug,
    name,
    manufacturer,
    category,
    description,
    heroImage: {
      src: heroImageSrc,
      alt: heroImageAlt,
    },
    registration: {
      number: registrationNumber,
      status: registrationStatus,
    },
    publication: {
      status: publicationStatus,
      publishedAt,
      verifiedAt,
    },
    characteristics: parseCharacteristics(payload.characteristics),
    claims: parseClaims(payload.claims),
    keySummary,
    sources: parseSources(payload.sources),
    publicationHistory: parsePublicationHistory(payload.publicationHistory),
  };
}

export async function getPublicProductPage(
  slug: string,
): Promise<ProductPageLoadResult> {
  try {
    const row = await createServerSupabaseClient().getProductPage(slug);

    if (!row) {
      return { status: "not-found" };
    }

    const product = parseProduct(row.page_payload);

    if (!product) {
      return {
        status: "error",
        message: "Опубликованная карточка имеет некорректный формат.",
      };
    }

    return { status: "success", product };
  } catch (error) {
    console.error("Failed to load public product projection", error);
    return {
      status: "error",
      message: "Опубликованная карточка временно недоступна.",
    };
  }
}
