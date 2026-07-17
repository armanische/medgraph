import type { MetadataRoute } from "next";

import {
  categoryService,
  manufacturerService,
  productService,
} from "@/lib/storefront";
import { buildStorefrontSitemap } from "@/lib/storefront/storefront-sitemap";

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildStorefrontSitemap({
    productService,
    manufacturerService,
    categoryService,
  });
}
