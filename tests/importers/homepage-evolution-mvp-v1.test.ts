import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("Homepage selects the approved public products through a fail-closed selector", async () => {
  const page = await source("app/page.tsx");
  const equipment = await source("components/home/Equipment.tsx");

  assert.match(page, /selectPublishedFeaturedProducts\(products\)/u);
  assert.match(equipment, /if \(!products\) return null/u);
  assert.doesNotMatch(`${page}\n${equipment}`, /getFeaturedProducts|popularProducts|recommendedProducts|newestProducts/iu);
});

test("Equipment section maps public presentation data into the interactive carousel", async () => {
  const equipment = await source("components/home/Equipment.tsx");
  const carousel = await source("components/home/FeaturedProductsCarousel.tsx");

  assert.match(equipment, /<FeaturedProductsCarousel/u);
  assert.match(carousel, /href=\{`\/catalog\/\$\{product\.slug\}`\}/u);
  assert.doesNotMatch(carousel, /lifecycle|sourceChecksum|rawSnapshot/u);
});

test("Hero images and final CTA use only the approved public content", async () => {
  const [hero, cta] = await Promise.all([
    source("components/home/Hero.tsx"),
    source("components/home/CTA.tsx"),
  ]);

  assert.match(hero, /heroProduct\?\.media\.find\(\(\{ type \}\) => type === "image"\)/u);
  assert.match(hero, /<Image/u);
  assert.doesNotMatch(hero, /stock|doctor|hospital|https:\/\//iu);
  assert.match(cta, /Не нашли нужное оборудование\?/u);
  assert.match(cta, /Отправьте наименование, модель или техническое задание/u);
});
