import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { validateStorefrontCatalog } from "../../lib/storefront/schemas.ts";
import type { StorefrontCatalog } from "../../lib/storefront/types.ts";

const catalogRoot = resolve(process.cwd(), "data/storefront");
const temporaryRoots: string[] = [];

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function loadFixture(): Promise<StorefrontCatalog> {
  return validateStorefrontCatalog({
    products: await Promise.all([
      readJson(join(catalogRoot, "products/fs510.json")),
      readJson(join(catalogRoot, "products/ambu-vivasight-2-dlt.json")),
    ]),
    manufacturers: await Promise.all([
      readJson(join(catalogRoot, "manufacturers/alba-healthcare.json")),
      readJson(join(catalogRoot, "manufacturers/ambu.json")),
    ]),
    categories: await Promise.all([
      readJson(join(catalogRoot, "categories/anesthesia-respiratory.json")),
      readJson(join(catalogRoot, "categories/airway-management.json")),
    ]),
    summary: await readJson(join(catalogRoot, "catalog-summary.json")),
  });
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function temporaryCatalog(
  mutate: (catalog: StorefrontCatalog) => void,
): Promise<FilesystemCatalogRepository> {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-storefront-"));
  temporaryRoots.push(root);
  const catalog = structuredClone(await loadFixture());
  mutate(catalog);

  await Promise.all(
    ["products", "manufacturers", "categories"].map((directory) =>
      mkdir(join(root, directory), { recursive: true }),
    ),
  );
  await Promise.all([
    ...catalog.products.map((product, index) =>
      writeJson(join(root, "products", `${index}-${product.slug}.json`), product),
    ),
    ...catalog.manufacturers.map((manufacturer, index) =>
      writeJson(
        join(root, "manufacturers", `${index}-${manufacturer.slug}.json`),
        manufacturer,
      ),
    ),
    ...catalog.categories.map((category, index) =>
      writeJson(join(root, "categories", `${index}-${category.slug}.json`), category),
    ),
    writeJson(join(root, "catalog-summary.json"), catalog.summary),
  ]);
  return new FilesystemCatalogRepository(root);
}

after(async () => {
  await Promise.all(
    temporaryRoots.map((root) => rm(root, { recursive: true, force: true })),
  );
});

test("filesystem repository loads a valid storefront catalog", async () => {
  const repository = new FilesystemCatalogRepository(catalogRoot);

  assert.equal((await repository.getProducts()).length, 2);
  assert.equal((await repository.getManufacturers()).length, 2);
  assert.equal((await repository.getCategories()).length, 2);
  assert.deepEqual(await repository.getCatalogSummary(), {
    schemaVersion: 1,
    generatedAt: "2026-07-17T00:00:00.000Z",
    productCount: 2,
    activeProductCount: 2,
    manufacturerCount: 2,
    categoryCount: 2,
  });
});

test("repository finds a product by slug", async () => {
  const repository = new FilesystemCatalogRepository(catalogRoot);

  assert.equal((await repository.getProductBySlug("fs510"))?.model, "FS510");
  assert.equal(await repository.getProductBySlug("missing-product"), null);
});

test("active products include active and on_request but exclude hidden", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products[1].status = "hidden";
    catalog.summary.activeProductCount = 1;
  });

  assert.deepEqual(
    (await repository.getActiveProducts()).map(({ slug }) => slug),
    ["fs510"],
  );
});

test("repository filters products by manufacturer", async () => {
  const repository = new FilesystemCatalogRepository(catalogRoot);
  const products = await repository.getProductsByManufacturer("manufacturer-ambu");

  assert.deepEqual(products.map(({ slug }) => slug), ["ambu-vivasight-2-dlt"]);
});

test("repository filters products by category", async () => {
  const repository = new FilesystemCatalogRepository(catalogRoot);
  const products = await repository.getProductsByCategory("category-anesthesia-respiratory");

  assert.deepEqual(products.map(({ slug }) => slug), ["fs510"]);
});

test("repository searches public products deterministically", async () => {
  const repository = new FilesystemCatalogRepository(catalogRoot);

  assert.deepEqual(
    (await repository.searchProducts("одноразовая камера")).map(({ slug }) => slug),
    ["ambu-vivasight-2-dlt"],
  );
  assert.deepEqual(await repository.searchProducts(""), []);
});

test("validation rejects duplicate product slugs", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products.push({
      ...structuredClone(catalog.products[0]),
      id: "product-fs510-copy",
    });
    catalog.summary.productCount += 1;
    catalog.summary.activeProductCount += 1;
  });

  await assert.rejects(repository.getProducts(), /Duplicate product slug "fs510"/);
});

test("validation rejects a missing manufacturerId", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products[0].manufacturerId = "manufacturer-missing";
  });

  await assert.rejects(
    repository.getProducts(),
    /references missing manufacturerId "manufacturer-missing"/,
  );
});

test("validation rejects a missing categoryId", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products[0].categoryId = "category-missing";
  });

  await assert.rejects(
    repository.getProducts(),
    /references missing categoryId "category-missing"/,
  );
});

test("validation rejects broken relatedProductIds", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products[0].relatedProductIds = ["product-missing"];
  });

  await assert.rejects(
    repository.getProducts(),
    /references missing relatedProductId "product-missing"/,
  );
});

test("validation rejects broken compatibleProductId", async () => {
  const repository = await temporaryCatalog((catalog) => {
    catalog.products[0].compatibility[0].compatibleProductId = "product-missing";
  });

  await assert.rejects(
    repository.getProducts(),
    /references missing compatibleProductId "product-missing"/,
  );
});

test("strict public schemas reject internal workflow fields", async () => {
  const repository = await temporaryCatalog((catalog) => {
    const product = catalog.products[0] as unknown as Record<string, unknown>;
    product.reviewStatus = "approved";
  });

  await assert.rejects(repository.getProducts(), /Unrecognized key: "reviewStatus"/);
});
