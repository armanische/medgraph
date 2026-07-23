interface HomepageOverviewLoaders<Product, Manufacturer, Category> {
  products: () => Promise<readonly Product[]>;
  manufacturers: () => Promise<readonly Manufacturer[]>;
  categories: () => Promise<readonly Category[]>;
}

export interface HomepageOverviewSources<Product, Manufacturer, Category> {
  products: readonly Product[] | null;
  manufacturers: readonly Manufacturer[] | null;
  categories: readonly Category[] | null;
}

function valueOrNull<T>(result: PromiseSettledResult<readonly T[]>) {
  return result.status === "fulfilled" ? result.value : null;
}

export async function loadHomepageOverviewSources<Product, Manufacturer, Category>(
  loaders: HomepageOverviewLoaders<Product, Manufacturer, Category>,
): Promise<HomepageOverviewSources<Product, Manufacturer, Category>> {
  const [products, manufacturers, categories] = await Promise.allSettled([
    loaders.products(),
    loaders.manufacturers(),
    loaders.categories(),
  ]);

  return {
    products: valueOrNull(products),
    manufacturers: valueOrNull(manufacturers),
    categories: valueOrNull(categories),
  };
}
