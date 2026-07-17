import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildBreadcrumbJsonLd,
  buildStorefrontMetadata,
  serializeStorefrontJsonLd,
  STOREFRONT_SITE_URL,
} from "../../lib/storefront/seo.ts";

test("Storefront metadata helper builds canonical social and robots fields", () => {
  const previous = process.env.CYBERMEDICA_ALLOW_INDEXING;
  process.env.CYBERMEDICA_ALLOW_INDEXING = "1";
  try {
    const metadata = buildStorefrontMetadata({
      title: "Test product",
      description: "Test description",
      canonical: "/catalog/test-product",
      image: { url: "/test-product.jpg", alt: "Test product" },
    });

    assert.equal(metadata.title, "Test product");
    assert.equal(metadata.description, "Test description");
    assert.equal(metadata.alternates?.canonical, "/catalog/test-product");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    assert.equal(metadata.openGraph?.url, "/catalog/test-product");
    assert.equal(metadata.openGraph?.siteName, "CyberMedica");
    assert.equal(metadata.openGraph?.locale, "ru_RU");
    const twitter = metadata.twitter as
      | { card?: string; images?: string[] }
      | undefined;
    assert.equal(twitter?.card, "summary_large_image");
    assert.deepEqual(twitter?.images, ["/test-product.jpg"]);
  } finally {
    if (previous === undefined) {
      delete process.env.CYBERMEDICA_ALLOW_INDEXING;
    } else {
      process.env.CYBERMEDICA_ALLOW_INDEXING = previous;
    }
  }
});

test("Storefront routes use the unified SEO helper", async () => {
  const routes = [
    "app/page.tsx",
    "app/catalog/page.tsx",
    "app/catalog/[slug]/page.tsx",
    "app/manufacturers/page.tsx",
    "app/manufacturers/[slug]/page.tsx",
    "app/compare/page.tsx",
    "app/search/page.tsx",
  ];
  const sources = await Promise.all(
    routes.map((route) => readFile(route, "utf8")),
  );

  for (const source of sources) {
    assert.match(source, /buildStorefrontMetadata/u);
    assert.doesNotMatch(source, /verticals\/fs510|public-product-page/iu);
  }
});

test("breadcrumb JSON-LD is absolute deterministic and safely serialized", () => {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Главная", path: "/" },
    { name: "Каталог <оборудования>", path: "/catalog" },
  ]);

  assert.deepEqual(breadcrumb.itemListElement, [
    {
      "@type": "ListItem",
      position: 1,
      name: "Главная",
      item: `${STOREFRONT_SITE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Каталог <оборудования>",
      item: `${STOREFRONT_SITE_URL}/catalog`,
    },
  ]);
  assert.equal(serializeStorefrontJsonLd(breadcrumb).includes("<"), false);
  assert.match(
    serializeStorefrontJsonLd(breadcrumb),
    /\\u003cоборудования\\u003e/u,
  );
});

test("query metadata can be noindex-follow without weakening the environment gate", () => {
  const previous = process.env.CYBERMEDICA_ALLOW_INDEXING;
  process.env.CYBERMEDICA_ALLOW_INDEXING = "1";
  try {
    const metadata = buildStorefrontMetadata({
      title: "Search",
      description: "Search results",
      canonical: "/search",
      noindexFollow: true,
    });

    assert.deepEqual(metadata.robots, { index: false, follow: true });
  } finally {
    if (previous === undefined) {
      delete process.env.CYBERMEDICA_ALLOW_INDEXING;
    } else {
      process.env.CYBERMEDICA_ALLOW_INDEXING = previous;
    }
  }
});

test("Storefront sitemap and metadata share one site URL constant", async () => {
  const source = await readFile("lib/storefront/storefront-sitemap.ts", "utf8");

  assert.match(source, /STOREFRONT_SITE_URL.*\.\/seo\.ts/u);
  assert.doesNotMatch(source, /https:\/\/cybermedica\.ru/u);
});
