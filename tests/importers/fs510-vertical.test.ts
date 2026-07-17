import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { STOREFRONT_SITE_URL } from "../../lib/storefront/storefront-sitemap.ts";
import { buildFs510Sitemap } from "../../lib/verticals/fs510/sitemap.ts";

test("FS510 route imports its isolated vertical loader and component", async () => {
  const source = await readFile("app/products/fs510/page.tsx", "utf8");

  assert.match(source, /@\/lib\/verticals\/fs510\/public-product-page/u);
  assert.match(source, /@\/components\/verticals\/fs510\/ProvenanceChain/u);
  assert.doesNotMatch(
    source,
    /@\/lib\/public-product-page|@\/lib\/supabase\/server|@\/types\/public-product-page/u,
  );
});

test("legacy shared projection module paths no longer exist", async () => {
  const legacyPaths = [
    "lib/public-product-page.ts",
    "lib/supabase/server.ts",
    "types/public-product-page.ts",
    "components/product-page/ProvenanceChain.tsx",
  ];

  for (const path of legacyPaths) {
    await assert.rejects(access(path));
  }
});

test("FS510 Supabase adapter remains server-only and read-only", async () => {
  const [adapter, loader] = await Promise.all([
    readFile("lib/verticals/fs510/supabase-projection.ts", "utf8"),
    readFile("lib/verticals/fs510/public-product-page.ts", "utf8"),
  ]);

  assert.match(adapter, /import "server-only"/u);
  assert.match(loader, /import "server-only"/u);
  assert.match(adapter, /PUBLIC_SCHEMA = "public_api"/u);
  assert.match(adapter, /cache: "no-store"/u);
  assert.doesNotMatch(adapter, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/iu);
  assert.doesNotMatch(loader, /@\/lib\/(?:storefront|review)|data\//u);
});

test("shared Storefront sitemap does not know FS510 vertical routes", async () => {
  const storefrontSource = await readFile(
    "lib/storefront/storefront-sitemap.ts",
    "utf8",
  );
  const appSource = await readFile("app/sitemap.ts", "utf8");

  assert.doesNotMatch(storefrontSource, /products\/fs510|knowledge\/fs510/u);
  assert.doesNotMatch(
    storefrontSource,
    /public-product-page|product_pages|supabase|verticals\/fs510/iu,
  );
  assert.match(appSource, /buildFs510Sitemap/u);
});

test("FS510 product vertical is noindex-follow and excluded from its sitemap", async () => {
  const modified = new Date("2026-07-17T00:00:00.000Z");
  const sitemap = buildFs510Sitemap(modified);
  const pageSource = await readFile("app/products/fs510/page.tsx", "utf8");

  assert.deepEqual(
    sitemap.map(({ url }) => url),
    [`${STOREFRONT_SITE_URL}/knowledge/fs510`],
  );
  assert.equal(
    sitemap.some(({ url }) => new URL(url).pathname === "/products/fs510"),
    false,
  );
  assert.ok(sitemap.every(({ lastModified }) => lastModified === modified));
  assert.match(
    pageSource,
    /robots:\s*\{\s*index:\s*false,\s*follow:\s*true,?\s*\}/u,
  );
});
