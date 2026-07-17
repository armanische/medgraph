import type { MetadataRoute } from "next";

import type { CategoryService } from "./category-service.ts";
import type { ManufacturerService } from "./manufacturer-service.ts";
import type { ProductService } from "./product-service.ts";

export const STOREFRONT_SITE_URL = "https://cybermedica.ru";

interface StorefrontSitemapSources {
  productService: Pick<ProductService, "getActiveProducts">;
  manufacturerService: Pick<ManufacturerService, "getManufacturers">;
  categoryService: Pick<CategoryService, "getCategories">;
}

function absoluteUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl).toString();
}

function latestUpdatedAt(values: readonly { updatedAt: string }[]) {
  const timestamps = values
    .map(({ updatedAt }) => Date.parse(updatedAt))
    .filter(Number.isFinite);
  return new Date(timestamps.length ? Math.max(...timestamps) : 0);
}

export async function buildStorefrontSitemap(
  sources: StorefrontSitemapSources,
  siteUrl = STOREFRONT_SITE_URL,
): Promise<MetadataRoute.Sitemap> {
  const [products, manufacturers, categories] = await Promise.all([
    sources.productService.getActiveProducts(),
    sources.manufacturerService.getManufacturers(),
    sources.categoryService.getCategories(),
  ]);
  const activeCategoryIds = new Set(categories.map(({ id }) => id));
  const sitemapProducts = products.filter(({ categoryId }) =>
    activeCategoryIds.has(categoryId),
  );
  const lastModified = latestUpdatedAt([
    ...sitemapProducts,
    ...manufacturers,
    ...categories,
  ]);
  const url = (path: string) => absoluteUrl(path, siteUrl);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: url("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: url("/catalog"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: url("/search"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: url("/compare"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.76,
    },
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
    {
      url: url("/manufacturers"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: url("/request"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
  const productRoutes: MetadataRoute.Sitemap = sitemapProducts.map(
    (product) => ({
      url: url(`/catalog/${product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly",
      priority: 0.72,
    }),
  );
  const manufacturerRoutes: MetadataRoute.Sitemap = manufacturers.map(
    (manufacturer) => ({
      url: url(`/manufacturers/${manufacturer.slug}`),
      lastModified: new Date(manufacturer.updatedAt),
      changeFrequency: "monthly",
      priority: 0.62,
    }),
  );

  return [...staticRoutes, ...productRoutes, ...manufacturerRoutes];
}
