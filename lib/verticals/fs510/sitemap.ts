import type { MetadataRoute } from "next";

import { STOREFRONT_SITE_URL } from "../../storefront/storefront-sitemap.ts";

type SitemapLastModified = MetadataRoute.Sitemap[number]["lastModified"];

export function buildFs510Sitemap(
  lastModified: SitemapLastModified,
  siteUrl = STOREFRONT_SITE_URL,
): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();

  return [
    {
      url: url("/products/fs510"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: url("/knowledge/fs510"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];
}
