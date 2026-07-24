import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("Homepage Evolution selects exactly four public products without merchandising logic", async () => {
  const page = await source("app/page.tsx");
  const equipment = await source("components/home/Equipment.tsx");

  assert.match(page, /const catalogEquipment = products\?\.slice\(0, 4\) \?\? null/u);
  assert.match(equipment, /if \(!products \|\| products\.length < 4\) return null/u);
  assert.equal((equipment.match(/products\.slice\(0, 4\)/gu) ?? []).length, 1);
  assert.doesNotMatch(`${page}\n${equipment}`, /getFeaturedProducts|popularProducts|recommendedProducts|newestProducts/iu);
});

test("Equipment section reuses the canonical ProductCard without changing its API", async () => {
  const equipment = await source("components/home/Equipment.tsx");
  const card = await source("components/storefront/ProductCard.tsx");

  assert.match(equipment, /import ProductCard from "@\/components\/storefront\/ProductCard"/u);
  assert.match(equipment, /<ProductCard[\s\S]*product=\{product\}/u);
  assert.doesNotMatch(equipment, /HomepageProductCard|FeaturedProductCard|CatalogProductCard|<article/u);
  assert.doesNotMatch(card, /homepage|featured|recommended|exclusive|marketing/iu);
});

test("Hero images and final CTA use only the approved public content", async () => {
  const [hero, cta] = await Promise.all([
    source("components/home/Hero.tsx"),
    source("components/home/CTA.tsx"),
  ]);

  assert.match(hero, /product\.media\.find\(\(\{ type \}\) => type === "image"\)/u);
  assert.match(hero, /<Image/u);
  assert.doesNotMatch(hero, /stock|doctor|hospital|https:\/\//iu);
  assert.match(cta, /Нужна помощь с подбором оборудования\?/u);
  assert.match(cta, /Опишите задачу, необходимые характеристики или известную модель/u);
});
