import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("homepage uses the official brand asset and approved search-first hero", async () => {
  const header = await source("components/layout/Header.tsx");
  const footer = await source("components/home/Footer.tsx");
  const hero = await source("components/home/Hero.tsx");

  assert.match(header, /\/brand\/cybermedica-logo\.png/u);
  assert.match(footer, /\/brand\/cybermedica-logo\.png/u);
  assert.match(hero, /Медицинское оборудование для клиник и медицинских организаций/u);
  assert.match(
    hero,
    /Найдите оборудование по названию, модели, производителю или категории/u,
  );
  assert.match(hero, /<Search \/>/u);
  assert.match(hero, /Перейти в каталог/u);
  assert.match(hero, /<Image/u);
  assert.match(hero, /product\.media\.find/u);
  assert.doesNotMatch(hero, /Запросить КП|ведущих мировых/u);
});

test("homepage search exposes the approved prompt without duplicate discovery UI", async () => {
  const search = await source("components/home/Search.tsx");

  assert.match(
    search,
    /Название, модель, производитель или категория/u,
  );
  assert.match(search, />\s*Найти\s*</u);
  assert.match(search, /`\/catalog\?q=/u);
  assert.doesNotMatch(search, /popularQueries|Популярные запросы|role="listbox"/u);
});

test("category cards stay text-first while Homepage reuses the canonical ProductCard", async () => {
  const categories = await source("components/home/Categories.tsx");
  const page = await source("app/page.tsx");
  const equipment = await source("components/home/Equipment.tsx");

  assert.doesNotMatch(categories, /<Image|category\.image|<CategoryIcon/u);
  assert.doesNotMatch(categories, /padStart|String\(index \+ 1\)/u);
  assert.match(categories, /category\.shortDescription/u);
  assert.match(categories, /category\.productCount/u);
  assert.match(page, /categoryProductCounts/u);
  assert.doesNotMatch(page, /FeaturedProducts|getFeaturedProducts|product\.media\.find/u);
  assert.match(page, /<Equipment/u);
  assert.match(equipment, /import ProductCard from "@\/components\/storefront\/ProductCard"/u);
  assert.match(equipment, /<ProductCard/u);
  assert.doesNotMatch(equipment, /<article|HomepageProductCard|FeaturedProductCard|CatalogProductCard/u);
});

test("rendered homepage removes obsolete technical copy", async () => {
  const renderedFiles = [
    "components/home/Hero.tsx",
    "components/home/Search.tsx",
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
    "components/home/Footer.tsx",
  ];
  const combined = (await Promise.all(renderedFiles.map(source))).join("\n");

  for (const obsolete of [
    "ведущих мировых производителей",
    "Популярные товары",
    "Модель из каталога",
    "структура каталога",
    "Производитель → Категория → Товар → Запрос КП",
  ]) {
    assert.doesNotMatch(combined, new RegExp(obsolete, "iu"));
  }
});

test("final homepage CTA uses the approved commercial request", async () => {
  const cta = await source("components/home/CTA.tsx");

  assert.match(cta, /Нужна помощь с подбором оборудования\?/u);
  assert.match(
    cta,
    /Опишите задачу, необходимые характеристики или известную модель/u,
  );
  assert.match(cta, /Перейти в каталог/u);
  assert.match(cta, /Запросить КП/u);
  assert.ok(cta.indexOf("Перейти в каталог") < cta.indexOf("Запросить КП"));
});
