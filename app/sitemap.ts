import type { MetadataRoute } from "next";

import {
  categoryService,
  manufacturerService,
  productService,
  storefrontDataSource,
} from "@/lib/storefront";
import { buildStorefrontSitemap } from "@/lib/storefront/storefront-sitemap";
import { buildFs510Sitemap } from "@/lib/verticals/fs510/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (storefrontDataSource === "cloud_preview") return [];
  const storefrontSitemap = await buildStorefrontSitemap({
    productService,
    manufacturerService,
    categoryService,
  });
  const lastModified = storefrontSitemap[0]?.lastModified ?? new Date(0);

  return [...storefrontSitemap, ...buildFs510Sitemap(lastModified)];
}
