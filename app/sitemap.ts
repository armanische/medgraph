import type { MetadataRoute } from "next";

import { manufacturers } from "@/data/manufacturers";
import { getDraftCatalogGeneratedAt, getDraftCatalogProducts } from "@/lib/catalog-drafts";

const siteUrl = "https://cybermedica.ru";

function url(path: string) {
  return new URL(path, siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getDraftCatalogGeneratedAt());

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

  const catalogRoutes = getDraftCatalogProducts().map((product) => ({
    url: url(`/catalog/${product.slug}`),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const manufacturerRoutes = manufacturers.map((manufacturer) => ({
    url: url(`/manufacturers/${manufacturer.slug}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.62,
  }));

  return [...staticRoutes, ...catalogRoutes, ...manufacturerRoutes];
}
