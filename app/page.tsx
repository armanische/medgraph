import type { Metadata } from "next";

import Hero from "@/components/home/Hero";
import FeaturedManufacturers from "@/components/home/FeaturedManufacturers";
import Categories from "@/components/home/Categories";
import WhyCyberMedica from "@/components/home/WhyCyberMedica";
import CTA from "@/components/home/CTA";
import JsonLd from "@/components/seo/JsonLd";
import {
  categoryService,
  manufacturerService,
  productService,
  storefrontDataSource,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildHomepageStructuredData } from "@/lib/storefront/structured-data";
import { formatCountryForPublic } from "@/lib/storefront/country-presentation";

const homepageDescription =
  "Каталог медицинского оборудования для клиник, медицинских организаций и специалистов по закупкам.";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Каталог медицинского оборудования",
  description: homepageDescription,
  canonical: "/",
});

export default async function Home() {
  const [products, manufacturers, categories] = await Promise.all([
    productService.getActiveProducts(),
    manufacturerService.getManufacturers(),
    categoryService.getCategories(),
  ]);
  const categoryProductCounts = new Map<string, number>();
  const manufacturerProductCounts = new Map<string, number>();

  for (const product of products) {
    categoryProductCounts.set(
      product.categoryId,
      (categoryProductCounts.get(product.categoryId) ?? 0) + 1,
    );
    manufacturerProductCounts.set(
      product.manufacturerId,
      (manufacturerProductCounts.get(product.manufacturerId) ?? 0) + 1,
    );
  }

  const categoryEntries = categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      shortDescription: category.shortDescription,
      productCount: categoryProductCounts.get(category.id) ?? 0,
    }))
    .filter(({ productCount }) => productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount ||
      left.name.localeCompare(right.name, "ru-RU"),
    )
    .slice(0, 6);
  const manufacturerEntries = manufacturers
    .map((manufacturer) => ({
      id: manufacturer.id,
      slug: manufacturer.slug,
      name: manufacturer.name,
      country: formatCountryForPublic(manufacturer.country),
      logoUrl: manufacturer.logoUrl,
      productCount: manufacturerProductCounts.get(manufacturer.id) ?? 0,
    }))
    .filter(({ productCount }) => productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount ||
      left.name.localeCompare(right.name, "ru-RU"),
    )
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-cm-canvas">
      {storefrontDataSource !== "cloud_preview" && (
        <JsonLd data={buildHomepageStructuredData(homepageDescription)} />
      )}
      <Hero />
      <Categories categories={categoryEntries} />
      <FeaturedManufacturers manufacturers={manufacturerEntries} />
      <WhyCyberMedica />
      <CTA />
    </main>
  );
}
