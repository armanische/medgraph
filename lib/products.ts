import { products } from "@/data/products";

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getManufacturerProducts(manufacturerSlug: string) {
  return products.filter(
    (product) => product.manufacturerSlug === manufacturerSlug
  );
}

export function searchProducts(query: string) {
  const value = query.trim().toLocaleLowerCase("ru");

  if (!value) {
    return products;
  }

  return products.filter((product) => {
    const searchable = [
      product.name,
      product.manufacturer,
      product.category,
      product.description,
      ...product.searchTerms,
      ...product.analogs,
      ...product.compatibility,
      ...Object.values(product.identifiers),
    ]
      .join(" ")
      .toLocaleLowerCase("ru");

    return searchable.includes(value);
  });
}
