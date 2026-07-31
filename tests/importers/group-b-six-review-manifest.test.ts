import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("generic review manifest contains the exact resolved Group B six and excludes Instilar 1438", async () => {
  const manifest = await readFile("lib/review/publication-revision-manifest.ts", "utf8");
  const page = await readFile("app/internal/review/[revisionId]/page.tsx", "utf8");

  for (const revisionId of [
    "d0095254-3b5b-4bea-8021-700e5af1c8d5",
    "c629b5d2-7b13-4fda-9da6-d004b579fb18",
    "7700d1ef-fd92-4d46-81d7-e1a981e939df",
    "676523c3-90bf-4a31-98d1-bd7c6af34c9f",
    "d2ed13c0-43a9-468a-a19f-683c289b1e6f",
    "26771e99-4d44-4d12-85f6-267187d77654",
  ]) {
    assert.match(manifest, new RegExp(revisionId, "u"));
  }

  assert.doesNotMatch(manifest, /e7a54ec6-986d-422a-aca8-862d4d00a421/u);
  assert.doesNotMatch(manifest, /532456144899/u);
  assert.match(manifest, /candidatePayloadChecksum\?: string/u);
  assert.match(page, /manifest\.candidatePayloadChecksum \?\? manifest\.payloadChecksum/u);
  assert.match(page, /Immutable payload checksum/u);
});
