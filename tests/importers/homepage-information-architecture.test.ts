import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("homepage follows the Storefront information architecture", async () => {
  const page = await source("app/page.tsx");
  const sections = [
    "<Hero",
    "<Search",
    "<Categories",
    "<FeaturedManufacturers",
    "<FeaturedProducts",
    "<WhyCyberMedica",
    "<CTA",
  ];
  const positions = sections.map((section) => page.indexOf(section));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(page, /<PlatformStats/u);
});

test("Hero communicates the catalog value and exposes only credible public actions", async () => {
  const hero = await source("components/home/Hero.tsx");

  assert.match(hero, /<h1/u);
  assert.match(hero, /Каталог медицинского оборудования/u);
  assert.match(hero, /href="\/catalog"/u);
  assert.match(hero, /href="\/request"/u);
  assert.match(hero, /href="\/manufacturers"/u);
  assert.match(hero, /href="#homepage-search"/u);
  assert.doesNotMatch(hero, /href="\/compare"/u);
  assert.doesNotMatch(hero, /["']use client["']/u);
});

test("homepage search is an accessible primary landmark and routes through global search", async () => {
  const search = await source("components/home/Search.tsx");

  assert.match(search, /id="homepage-search"/u);
  assert.match(search, /role="search"/u);
  assert.match(search, /aria-label="Поиск по каталогу медицинского оборудования"/u);
  assert.match(search, /htmlFor="homepage-search-input"/u);
  assert.match(search, /type="submit"/u);
  assert.match(search, /`\/search\?q=\$\{encodeURIComponent\(query\.trim\(\)\)\}`/u);
  assert.match(search, /role="listbox"/u);
  assert.match(search, /role="status"/u);
});

test("featured content is derived from existing Storefront services", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /productService\.getFeaturedProducts\(\)/u);
  assert.match(page, /manufacturerService\.getManufacturers\(\)/u);
  assert.match(page, /categoryService\.getCategories\(\)/u);
  assert.match(page, /featuredProducts\.map/u);
  assert.match(page, /manufacturers\.map/u);
  assert.match(page, /categories\.map/u);
  assert.doesNotMatch(page, /data\/public|data\/research|published-catalog/iu);
});

test("only the search interaction adds a homepage client boundary", async () => {
  const serverComponents = [
    "components/home/Hero.tsx",
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/FeaturedProducts.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
  ];
  const sources = await Promise.all(serverComponents.map(source));

  for (const component of sources) {
    assert.doesNotMatch(component, /["']use client["']/u);
  }
  assert.match(await source("components/home/Search.tsx"), /^"use client";/u);
});

test("section headings and final actions are explicitly labelled", async () => {
  const files = [
    "components/home/Hero.tsx",
    "components/home/Search.tsx",
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/FeaturedProducts.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
  ];
  const combined = (await Promise.all(files.map(source))).join("\n");

  assert.equal((combined.match(/<h1/gu) ?? []).length, 1);
  assert.ok((combined.match(/<h2/gu) ?? []).length >= 6);
  assert.match(combined, /aria-labelledby=/u);
  assert.match(combined, /aria-label="Следующие действия"/u);
  assert.match(combined, /focus-visible:/u);
});
