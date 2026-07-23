import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("Homepage MVP renders exactly the five approved blocks in order", async () => {
  const page = await source("app/page.tsx");
  const blocks = [
    "<Hero />",
    "<Categories",
    "<FeaturedManufacturers",
    "<WhyCyberMedica />",
    "<CTA />",
  ];
  const positions = blocks.map((block) => page.indexOf(block));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((left, right) => left - right));
  assert.doesNotMatch(page, /FeaturedProducts|PlatformStats|<Search/u);
});

test("Hero is search-first without illustration or premature request action", async () => {
  const [hero, search] = await Promise.all([
    source("components/home/Hero.tsx"),
    source("components/home/Search.tsx"),
  ]);

  assert.equal((hero.match(/<h1\b/gu) ?? []).length, 1);
  assert.match(hero, /Медицинское оборудование для клиник и медицинских организаций/u);
  assert.match(hero, /<Search \/>/u);
  assert.match(hero, /href="\/catalog"/u);
  assert.doesNotMatch(hero, /<Image|<svg|href="\/request"|product=/u);
  assert.match(search, /Найти оборудование/u);
  assert.match(search, /name="q"/u);
  assert.match(search, /router\.push\(`\/catalog\?q=\$\{encodeURIComponent\(query\)\}`\)/u);
  assert.match(search, /inputRef\.current\?\.focus\(\)/u);
  assert.doesNotMatch(search, /SearchService|results\.map|popularQueries/u);
});

test("categories and manufacturers follow the approved deterministic grids", async () => {
  const [page, categories, manufacturers] = await Promise.all([
    source("app/page.tsx"),
    source("components/home/Categories.tsx"),
    source("components/home/FeaturedManufacturers.tsx"),
  ]);

  assert.match(page, /productService\.getActiveProducts\(\)/u);
  assert.match(page, /categoryProductCounts/u);
  assert.match(page, /manufacturerProductCounts/u);
  assert.match(page, /\.slice\(0, 6\)/u);
  assert.match(page, /\.slice\(0, 8\)/u);
  assert.match(categories, /sm:grid-cols-2 lg:grid-cols-3/u);
  assert.match(manufacturers, /sm:grid-cols-2 lg:grid-cols-4/u);
  assert.match(categories, /if \(categories\?\.length === 0\) return null/u);
  assert.match(manufacturers, /if \(manufacturers\?\.length === 0\) return null/u);
  assert.doesNotMatch(categories, /<Image|category\.image|CategoryIcon/u);
  assert.match(manufacturers, /<ManufacturerMark/u);
});

test("advantages and Final CTA keep the approved visual hierarchy", async () => {
  const [advantages, cta] = await Promise.all([
    source("components/home/WhyCyberMedica.tsx"),
    source("components/home/CTA.tsx"),
  ]);

  for (const value of [
    "Подбор под задачу",
    "Помощь с поиском аналогов",
    "Доступные характеристики и документы",
    "Сопровождение запроса",
  ]) {
    assert.match(advantages, new RegExp(value, "u"));
  }
  assert.match(advantages, /sm:grid-cols-2 lg:grid-cols-4/u);
  assert.doesNotMatch(advantages, /<svg|BenefitIcon/u);
  assert.ok(cta.indexOf("Перейти в каталог") < cta.indexOf("Запросить КП"));
  assert.match(cta, /href="\/catalog" className="cm-button-primary/u);
  assert.match(cta, /href="\/request" className="cm-button-secondary/u);
  assert.doesNotMatch(cta, /bg-cm-ink|bg-cm-coral|blur-3xl/u);
});

test("Homepage keeps a single client boundary and no parallel data path", async () => {
  const serverPaths = [
    "app/page.tsx",
    "components/home/Hero.tsx",
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
  ];
  const serverSources = await Promise.all(serverPaths.map(source));
  const search = await source("components/home/Search.tsx");

  for (const component of serverSources) {
    assert.doesNotMatch(component, /^["']use client["']/u);
  }
  assert.match(search, /^"use client";/u);
  assert.doesNotMatch(
    `${serverSources.join("\n")}\n${search}`,
    /data\/public|data\/research|published-catalog|catalog-drafts|supabase/iu,
  );
  assert.doesNotMatch(search, /Product|Manufacturer|Category/u);
});
