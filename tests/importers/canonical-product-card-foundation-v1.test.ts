import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("Catalog delegates product presentation to the canonical ProductCard", async () => {
  const [catalog, productCard] = await Promise.all([
    source("components/catalog/CatalogExplorer.tsx"),
    source("components/storefront/ProductCard.tsx"),
  ]);

  assert.match(catalog, /import ProductCard from "@\/components\/storefront\/ProductCard"/u);
  assert.match(catalog, /<ProductCard/u);
  assert.match(catalog, /product=\{product\}/u);
  assert.match(catalog, /manufacturer=\{manufacturerEntry\}/u);
  assert.doesNotMatch(catalog, /<article|function ProductImage|product\.media\.find/u);
  assert.match(productCard, /export default function ProductCard/u);
  assert.doesNotMatch(productCard, /featured|recommended|exclusive|marketing|homepage/iu);
});

test("ProductCard preserves the public product, image and navigation contract", async () => {
  const productCard = await source("components/storefront/ProductCard.tsx");

  assert.match(productCard, /\{product\.name\}/u);
  assert.match(productCard, /manufacturer \? \(/u);
  assert.match(productCard, /\{manufacturer\.name\}/u);
  assert.match(productCard, /product\.media\.find\(\(\{ type \}\) => type === "image"\)/u);
  assert.match(productCard, /alt=\{image\.alt\}/u);
  assert.match(productCard, /presentation\.mediaFallbackLabel/u);
  assert.match(productCard, /const productHref = `\/catalog\/\$\{product\.slug\}`/u);
  assert.match(productCard, /rememberCatalogReturn\(productHref\)/u);
  assert.match(productCard, /aria-label=\{`Открыть карточку \$\{product\.name\}`\}/u);
});

test("ProductCard remains fail-closed and avoids nested interactive elements", async () => {
  const productCard = await source("components/storefront/ProductCard.tsx");

  assert.match(productCard, /presentation\.shortDescription &&/u);
  assert.match(productCard, /product\.applicationAreas\.length > 0/u);
  assert.match(productCard, /cardSpecifications\.length > 0/u);
  assert.match(productCard, /compareEnabled && presentation\.canCompare/u);
  assert.doesNotMatch(productCard, /<Link[^>]*>\s*<Link/u);
  assert.doesNotMatch(productCard, /<button/iu);
});
