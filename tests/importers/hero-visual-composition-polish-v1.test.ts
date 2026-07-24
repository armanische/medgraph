import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Hero renders equipment as one non-interactive visual composition", async () => {
  const hero = await readFile("components/home/Hero.tsx", "utf8");

  assert.match(hero, /product\.media\.find\(\(\{ type \}\) => type === "image"\)/u);
  assert.match(hero, /relative mx-auto h-24/u);
  assert.match(hero, /hidden h-\[72%\].*sm:block/u);
  assert.match(hero, /object-contain drop-shadow/u);
  assert.doesNotMatch(hero, /grid grid-cols-2 gap-2/u);
  assert.doesNotMatch(hero, /rounded-lg border border-\[var\(--cm-rule\)\] bg-white/u);
  assert.match(hero, /<Search \/>/u);
  assert.match(hero, /href="\/catalog"/u);
  assert.doesNotMatch(hero, /href="\/catalog\/.+"|onClick|hover:/u);
});
