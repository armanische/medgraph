import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("homepage uses the official brand asset and professional hero copy", async () => {
  const header = await source("components/layout/Header.tsx");
  const footer = await source("components/home/Footer.tsx");
  const hero = await source("components/home/Hero.tsx");

  assert.match(header, /\/brand\/cybermedica-logo\.png/u);
  assert.match(footer, /\/brand\/cybermedica-logo\.png/u);
  assert.match(hero, /Каталог медицинского оборудования/u);
  assert.match(
    hero,
    /Оборудование ведущих мировых производителей для государственных и/u,
  );
  assert.match(hero, /Запросить коммерческое предложение/u);
  assert.match(hero, /<Image/u);
});

test("homepage search exposes the required prompt and popular queries", async () => {
  const search = await source("components/home/Search.tsx");

  assert.match(
    search,
    /Введите производителя, модель или категорию оборудования\.\.\./u,
  );
  for (const query of [
    "Аппараты ИВЛ",
    "УЗИ",
    "Мониторы пациента",
    "Эндоскопия",
  ]) {
    assert.match(search, new RegExp(query, "u"));
  }
  assert.match(search, />\s*Найти\s*</u);
});

test("category and product cards use visual public storefront fields", async () => {
  const categories = await source("components/home/Categories.tsx");
  const products = await source("components/home/FeaturedProducts.tsx");
  const page = await source("app/page.tsx");

  assert.match(categories, /<Image/u);
  assert.match(categories, /category\.image/u);
  assert.doesNotMatch(categories, /<CategoryIcon/u);
  assert.doesNotMatch(categories, /padStart|String\(index \+ 1\)/u);
  assert.match(products, /product\.image/u);
  assert.match(products, /product\.manufacturer/u);
  assert.match(products, /product\.country/u);
  assert.match(products, /Запросить КП/u);
  assert.match(page, /product\.media\.find/u);
  assert.match(page, /manufacturersById/u);
});

test("rendered homepage removes obsolete technical copy", async () => {
  const renderedFiles = [
    "components/home/Hero.tsx",
    "components/home/Search.tsx",
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/FeaturedProducts.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
    "components/home/Footer.tsx",
  ];
  const combined = (await Promise.all(renderedFiles.map(source))).join("\n");

  for (const obsolete of [
    "закупочные команды",
    "для клиник",
    "подбор оборудования",
    "структура каталога",
    "Производитель → Категория → Товар → Запрос КП",
  ]) {
    assert.doesNotMatch(combined, new RegExp(obsolete, "iu"));
  }
});

test("final homepage CTA uses the approved commercial request", async () => {
  const cta = await source("components/home/CTA.tsx");

  assert.match(cta, /Не нашли нужную модель\?/u);
  assert.match(
    cta,
    /Оставьте запрос, и мы поможем подобрать оборудование или аналог\./u,
  );
  assert.match(cta, /Запросить коммерческое предложение/u);
});
