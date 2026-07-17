import type { CatalogRepository } from "./catalog-repository.ts";
import type { Category, Manufacturer, Product } from "./types.ts";

type ProductSearchRepository = Pick<CatalogRepository, "searchProducts">;

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterProductsForSearch(
  products: readonly Product[],
  query: string,
  manufacturers: readonly Manufacturer[] = [],
  categories: readonly Category[] = [],
): readonly Product[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryTokens = normalizedQuery.split(" ");
  const manufacturerNames = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name]),
  );
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return products.filter((product) => {
    const haystack = normalizeSearchText(
      [
        product.name,
        product.model,
        product.slug,
        product.shortDescription,
        product.description,
        manufacturerNames.get(product.manufacturerId) ?? "",
        categoryNames.get(product.categoryId) ?? "",
        ...product.applicationAreas,
        ...product.keyFeatures,
        ...product.specifications.flatMap(({ group, label, value, unit }) => [
          group,
          label,
          value,
          unit ?? "",
        ]),
      ].join(" "),
    );
    return queryTokens.every((token) => haystack.includes(token));
  });
}

class InMemoryProductSearchRepository implements ProductSearchRepository {
  private readonly products: readonly Product[];
  private readonly manufacturers: readonly Manufacturer[];
  private readonly categories: readonly Category[];

  constructor(
    products: readonly Product[],
    manufacturers: readonly Manufacturer[],
    categories: readonly Category[],
  ) {
    this.products = products;
    this.manufacturers = manufacturers;
    this.categories = categories;
  }

  async searchProducts(query: string): Promise<readonly Product[]> {
    return filterProductsForSearch(
      this.products,
      query,
      this.manufacturers,
      this.categories,
    );
  }
}

export class SearchService {
  private readonly repository: ProductSearchRepository;

  constructor(repository: ProductSearchRepository) {
    this.repository = repository;
  }

  static forProducts(
    products: readonly Product[],
    manufacturers: readonly Manufacturer[],
    categories: readonly Category[],
  ) {
    return new SearchService(
      new InMemoryProductSearchRepository(products, manufacturers, categories),
    );
  }

  searchProducts(query: string) {
    return this.repository.searchProducts(query);
  }
}
