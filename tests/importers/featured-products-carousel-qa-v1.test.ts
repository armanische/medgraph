import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("responsive WebKit carousel smoke is exact and public-only", async () => {
  const [script, packageJson] = await Promise.all([
    readFile("scripts/qa/featured-carousel-smoke.ts", "utf8"),
    readFile("package.json", "utf8"),
  ]);

  assert.match(packageJson, /"qa:featured-carousel"/u);
  assert.match(script, /webkit\.launch/u);
  assert.equal((script.match(/"\/catalog\//gu) ?? []).length, 8);
  assert.match(script, /iPhone portrait/u);
  assert.match(script, /tablet/u);
  assert.match(script, /desktop/u);
  assert.match(script, /documentElement\.scrollWidth <= document\.documentElement\.clientWidth/u);
  assert.match(script, /ArrowLeft/u);
  assert.doesNotMatch(script, /unpublished|service.role|credential|token/iu);
});
