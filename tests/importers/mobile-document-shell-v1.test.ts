import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../../app/layout.tsx", import.meta.url);

test("root layout renders without waiting for the remote catalog", async () => {
  const source = await readFile(layoutPath, "utf8");

  assert.match(source, /import "\.\/globals\.css";/);
  assert.match(
    source,
    /from "@\/lib\/storefront\/data-source"/,
    "layout must use the lightweight data-source module",
  );

  assert.doesNotMatch(source, /from "@\/lib\/storefront";/);
  assert.doesNotMatch(source, /\bconnection\s*\(/);
  assert.doesNotMatch(source, /loadHomepageOverviewSources/);
  assert.doesNotMatch(source, /productService/);
  assert.doesNotMatch(source, /manufacturerService/);
  assert.doesNotMatch(source, /categoryService/);
  assert.doesNotMatch(
    source,
    /export default async function RootLayout/,
    "RootLayout must remain synchronous",
  );
});
