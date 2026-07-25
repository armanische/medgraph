import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("Homepage Hero v2 derives one real catalog showcase without a new data path", async () => {
  const [page, hero, search, equipment] = await Promise.all([
    source("app/page.tsx"),
    source("components/home/Hero.tsx"),
    source("components/home/Search.tsx"),
    source("components/home/Equipment.tsx"),
  ]);

  assert.match(page, /<Hero products=\{products \?\? \[\]\} \/>/u);
  assert.match(hero, /const HERO_PRODUCT_SLUG = "767632362-330695211247-apparat-ivl-hamilton-t1"/u);
  assert.match(hero, /products\.find\(\(\{ slug \}\) => slug === HERO_PRODUCT_SLUG\)/u);
  assert.match(hero, /heroProduct && heroImage/u);
  assert.match(hero, /absolute inset-x-4 bottom-20 top-4/u);
  assert.match(hero, /МОДЕЛЬ ИЗ КАТАЛОГА/u);
  assert.match(hero, /\{heroProduct\.name\}/u);
  assert.match(hero, /href=\{`\/catalog\/\$\{heroProduct\.slug\}`\}/u);
  assert.match(hero, /Открыть карточку →/u);
  assert.match(hero, /focus-visible:outline/u);
  assert.match(hero, /group-hover:scale-\[1\.02\]/u);
  assert.match(hero, /<Search \/>/u);
  assert.match(search, /router\.push\(`\/catalog\?q=\$\{encodeURIComponent\(query\)\}`\)/u);
  assert.doesNotMatch(hero, /ProductCard|onClick|<button[\s\S]*Открыть карточку/u);
  assert.match(equipment, /import ProductCard from "@\/components\/storefront\/ProductCard"/u);
});
