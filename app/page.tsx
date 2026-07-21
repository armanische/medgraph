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
  isProductCommerciallyReady,
  manufacturerService,
  productService,
  storefrontDataSource,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildHomepageStructuredData } from "@/lib/storefront/structured-data";
import { getProductPresentation } from "@/lib/storefront/product-presentation";
import { formatCountryForPublic } from "@/lib/storefront/country-presentation";

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
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]),
  );
  const featuredIds = new Set(featuredProducts.map(({ id }) => id));
  const readyProducts = products.filter(isProductCommerciallyReady);
  const popularProducts = [
    ...featuredProducts,
    ...products.filter(({ id }) => !featuredIds.has(id)),
  ].filter(isProductCommerciallyReady).slice(0, 3);
  const featuredEntries = popularProducts.map((product) => {
    const manufacturer = manufacturersById.get(product.manufacturerId);
    const presentation = getProductPresentation(product, {
      categoryName: categoriesById.get(product.categoryId)?.name,
      country: manufacturer?.country,
      manufacturerName: manufacturer?.name,
    });
    return {
      id: product.id,
      slug: product.slug,
      category: presentation.categoryLabel,
      name: product.name,
      description: presentation.shortDescription ?? "",
      image: product.media.find(({ type }) => type === "image") ?? null,
      manufacturer: presentation.manufacturerLabel,
      country: presentation.countryLabel,
      commercialActionsEnabled: presentation.canRequestQuote,
    };
  });
  const usedCategoryImages = new Set<string>();
  const categoryEntries = categories
    .map((category) => {
      const categoryProducts = readyProducts.filter(
        (product) => product.categoryId === category.id,
      );
      const image = categoryProducts
        .flatMap((product) => product.media.filter(({ type }) => type === "image"))
        .find(({ url }) => !usedCategoryImages.has(url)) ?? null;
      if (image) usedCategoryImages.add(image.url);
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        shortDescription: category.shortDescription,
        productCount: categoryProducts.length,
        image,
      };
    })
    .filter(({ productCount }) => productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount ||
      left.name.localeCompare(right.name, "ru-RU"),
    )
    .slice(0, 8);
  const manufacturerEntries = manufacturers
    .map((manufacturer) => ({
      id: manufacturer.id,
      slug: manufacturer.slug,
      name: manufacturer.name,
      country: formatCountryForPublic(manufacturer.country),
      logoUrl: manufacturer.logoUrl,
      productCount: readyProducts.filter(
        (product) => product.manufacturerId === manufacturer.id,
      ).length,
    }))
    .filter(({ productCount }) => productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount ||
      left.name.localeCompare(right.name, "ru-RU"),
    )
    .slice(0, 8);
  const heroProduct =
    products
      .filter(({ slug }) => slug === "ambu-vivasight-2-dlt")
      .map((product) => ({
        name: product.name,
        image: product.media.find(({ type }) => type === "image") ?? null,
      }))
      .find(({ image }) => image !== null) ??
    featuredEntries.find(({ image }) => image !== null) ??
    products
      .map((product) => ({
        name: product.name,
        image: product.media.find(({ type }) => type === "image") ?? null,
      }))
      .find(({ image }) => image !== null) ??
    null;

  return (
    <main className="min-h-screen bg-cm-canvas">
      {storefrontDataSource !== "cloud_preview" && (
        <JsonLd data={buildHomepageStructuredData(homepageDescription)} />
      )}
      <Hero product={heroProduct} />
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
