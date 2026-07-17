import type { ProductService } from "./product-service.ts";
import type { Product, ProductSpecification } from "./types.ts";

export interface ComparisonSpecificationCell {
  specification: ProductSpecification | null;
}

export interface ComparisonTableRow {
  key: string;
  group: string;
  label: string;
  cells: readonly ComparisonSpecificationCell[];
  hasDifference: boolean;
}

export interface ProductComparison {
  products: readonly Product[];
  rows: readonly ComparisonTableRow[];
  summary: {
    products: number;
    specifications: number;
    differences: number;
    missingValues: number;
  };
}

function specificationKey(label: string) {
  return label.trim().toLocaleLowerCase("ru-RU");
}

function specificationValue(specification: ProductSpecification | null) {
  if (!specification) return null;
  return `${specification.value}\u0000${specification.unit ?? ""}`;
}

export class CompareService {
  private readonly productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  getComparableProducts(): Promise<readonly Product[]> {
    return this.productService.getActiveProducts();
  }

  async compareProducts(slugs: readonly string[]): Promise<ProductComparison> {
    const normalizedSlugs = [...new Set(slugs.map((slug) => slug.trim()))].filter(
      Boolean,
    );
    const products = (
      await Promise.all(
        normalizedSlugs.map((slug) => this.productService.getProductBySlug(slug)),
      )
    ).filter((product): product is Product => product !== null);
    const rows = this.buildComparisonTable(products);

    return {
      products,
      rows,
      summary: {
        products: products.length,
        specifications: rows.length,
        differences: rows.filter(({ hasDifference }) => hasDifference).length,
        missingValues: rows.reduce(
          (total, row) =>
            total + row.cells.filter(({ specification }) => !specification).length,
          0,
        ),
      },
    };
  }

  buildComparisonTable(
    products: readonly Product[],
  ): readonly ComparisonTableRow[] {
    const definitions = new Map<
      string,
      Pick<ProductSpecification, "group" | "label" | "position">
    >();

    for (const product of products) {
      for (const specification of [...product.specifications].sort(
        (left, right) => left.position - right.position,
      )) {
        const key = specificationKey(specification.label);
        if (!definitions.has(key)) definitions.set(key, specification);
      }
    }

    return [...definitions.entries()].map(([key, definition]) => {
      const cells = products.map(({ specifications }) => ({
        specification:
          specifications.find(
            ({ label }) => specificationKey(label) === key,
          ) ?? null,
      }));
      const values = cells.map(({ specification }) =>
        specificationValue(specification),
      );

      return {
        key,
        group: definition.group,
        label: definition.label,
        cells,
        hasDifference:
          values.length > 1 && values.some((value) => value !== values[0]),
      };
    });
  }
}
