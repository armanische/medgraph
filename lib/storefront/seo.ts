import type { Metadata } from "next";

export const STOREFRONT_SITE_URL = "https://cybermedica.ru";
export const STOREFRONT_SITE_NAME = "CyberMedica";

interface StorefrontSeoImage {
  url: string;
  alt: string;
}

interface StorefrontMetadataInput {
  title: string;
  description: string;
  canonical: `/${string}` | "/";
  image?: StorefrontSeoImage;
  noindexFollow?: boolean;
}

export interface StorefrontBreadcrumbItem {
  name: string;
  path: `/${string}` | "/";
}

export function buildStorefrontMetadata({
  title,
  description,
  canonical,
  image,
  noindexFollow = false,
}: StorefrontMetadataInput): Metadata {
  const images = image ? [{ url: image.url, alt: image.alt }] : undefined;
  const allowIndexing = process.env.CYBERMEDICA_ALLOW_INDEXING === "1"
    && process.env.CATALOG_DATA_SOURCE !== "cloud_preview";

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: allowIndexing && !noindexFollow,
      follow: allowIndexing,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: STOREFRONT_SITE_NAME,
      locale: "ru_RU",
      type: "website",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

export function buildBreadcrumbJsonLd(items: StorefrontBreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, STOREFRONT_SITE_URL).toString(),
    })),
  };
}

export function serializeStorefrontJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
