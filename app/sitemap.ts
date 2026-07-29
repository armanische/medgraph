import type { MetadataRoute } from "next";

import {
  categoryService,
  manufacturerService,
  productService,
  storefrontDataSource,
} from "@/lib/storefront";
import {
  buildStorefrontSitemap,
  buildStorefrontSitemapFromCatalog,
} from "@/lib/storefront/storefront-sitemap";
import { buildFs510Sitemap } from "@/lib/verticals/fs510/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (storefrontDataSource === "cloud_preview") return [];
  let storefrontSitemap: MetadataRoute.Sitemap;
  if (storefrontDataSource === "cloud_published") {
    const { loadCloudPublishedCatalog } = await import(
      "@/lib/storefront/cloud-published-catalog-repository"
    );
    storefrontSitemap = buildStorefrontSitemapFromCatalog(
      await loadCloudPublishedCatalog(),
    );
  } else {
    storefrontSitemap = await buildStorefrontSitemap({
      productService,
      manufacturerService,
      categoryService,
    });
  }
  if (storefrontDataSource === "cloud_published") return storefrontSitemap;

  const lastModified = storefrontSitemap[0]?.lastModified ?? new Date(0);
  return [...storefrontSitemap, ...buildFs510Sitemap(lastModified)];
}
