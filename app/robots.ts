import type { MetadataRoute } from "next";
import { isProductionIndexingEnvironment } from "../lib/storefront/indexing.ts";

const siteUrl = "https://cyber-medica.ru";

export function buildRobots(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): MetadataRoute.Robots {
  const allowIndexing = isProductionIndexingEnvironment(environment);

  return {
    rules: {
      userAgent: "*",
      ...(allowIndexing
        ? {
            allow: "/",
            disallow: [
              "/internal/",
              "/auth/",
              "/api/",
              "/admin/",
              "/workspace/",
              "/tender/",
              "/knowledge/",
              "/thanks",
            ],
          }
        : { disallow: "/" }),
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
