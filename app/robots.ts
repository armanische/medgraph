import type { MetadataRoute } from "next";
import { isCloudPreviewCatalog } from "@/lib/storefront/data-source";

const siteUrl = "https://cybermedica.ru";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.CYBERMEDICA_ALLOW_INDEXING === "1"
    && !isCloudPreviewCatalog();

  return {
    rules: {
      userAgent: "*",
      ...(allowIndexing ? { allow: "/" } : { disallow: "/" }),
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
