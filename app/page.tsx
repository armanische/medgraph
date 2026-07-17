import type { Metadata } from "next";

import Search from "@/components/home/Search";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedManufacturers from "@/components/home/FeaturedManufacturers";
import Categories from "@/components/home/Categories";
import WhyCyberMedica from "@/components/home/WhyCyberMedica";
import CTA from "@/components/home/CTA";
import JsonLd from "@/components/seo/JsonLd";
import {
  categoryService,
  manufacturerService,
  productService,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildHomepageStructuredData } from "@/lib/storefront/structured-data";

const homepageDescription =
  "CyberMedica объединяет медицинское оборудование, производителей, технические характеристики и подбор для клиник и закупочных команд.";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Каталог медицинского оборудования",
  description: homepageDescription,
  canonical: "/",
});

export default async function Home() {
  const [products, featuredProducts, manufacturers, categories] = await Promise.all([
    productService.getProducts(),
    productService.getFeaturedProducts(),
    manufacturerService.getManufacturers(),
    categoryService.getCategories(),
  ]);
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const featuredEntries = featuredProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    category: categoriesById.get(product.categoryId)?.name ?? product.categoryId,
    name: product.name,
    description: product.shortDescription,
  }));
  const categoryEntries = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    shortDescription: category.shortDescription,
    productCount: products.filter((product) => product.categoryId === category.id).length,
  }));
  const manufacturerEntries = manufacturers.map((manufacturer) => ({
    id: manufacturer.id,
    slug: manufacturer.slug,
    name: manufacturer.name,
    country: manufacturer.country,
    shortDescription: manufacturer.shortDescription,
    logoUrl: manufacturer.logoUrl,
    productCount: products.filter(
      (product) => product.manufacturerId === manufacturer.id,
    ).length,
  }));
  const stats = {
    productCount: products.length,
    manufacturerCount: manufacturers.length,
    categoryCount: categories.length,
  };

  return (
    <main className="min-h-screen bg-cm-canvas">
      <JsonLd data={buildHomepageStructuredData(homepageDescription)} />
      <Hero {...stats} />
      <Search
        products={products}
        manufacturers={manufacturers}
        categories={categories}
      />
      <Categories categories={categoryEntries} />
      <FeaturedManufacturers manufacturers={manufacturerEntries} />
      <FeaturedProducts products={featuredEntries} />
      <WhyCyberMedica />
      <CTA />
    </main>
  );
}
