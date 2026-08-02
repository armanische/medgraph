import assert from "node:assert/strict";

const owner = "cybermedicaooo@gmail.com";
const origin = new URL(process.env.CATALOG_SYNTHETIC_ORIGIN ?? "https://cyber-medica.ru");
assert.equal(origin.protocol, "https:");
assert.ok(["cyber-medica.ru", "www.cyber-medica.ru"].includes(origin.hostname));

async function read(path: string, expectedStatus = 200) {
  const started = Date.now();
  const response = await fetch(new URL(path, origin), {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: { "User-Agent": "CyberMedica-Corporate-Synthetic/1.0" },
  });
  assert.equal(response.status, expectedStatus, `${path} returned ${response.status}`);
  const text = await response.text();
  assert.ok(Date.now() - started < 12_000, `${path} exceeded the response budget`);
  return { response, text };
}

const [home, catalog, requestPage, sitemap, health] = await Promise.all([
  read("/"),
  read("/catalog"),
  read("/request"),
  read("/sitemap.xml"),
  read("/internal/health/catalog"),
]);
for (const [name, body] of [["home", home.text], ["catalog", catalog.text], ["request", requestPage.text]] as const) {
  assert.ok(body.trim().length > 500, `${name} returned near-empty HTML`);
  assert.doesNotMatch(body, /tilda-blocks-page|medvist\.ru/iu);
}
const productUrls = [...sitemap.text.matchAll(/<loc>(https:\/\/cyber-medica\.ru\/catalog\/[^<]+)<\/loc>/gu)]
  .map((match) => match[1]);
assert.ok(productUrls.length > 0, "sitemap contains no Product URLs");
assert.equal(new Set(productUrls).size, productUrls.length, "sitemap contains duplicate Products");
const detail = await read(new URL(productUrls[0]).pathname);
assert.ok(detail.text.trim().length > 500, "stable Product Detail returned near-empty HTML");
const api = await read("/api/request", 405);
assert.equal(api.text, "", "GET /api/request must not return a body");

const healthValue = JSON.parse(health.text) as {
  status?: unknown;
  snapshotProductCount?: unknown;
  fallbackActive?: unknown;
  lastKnownGoodAgeSeconds?: unknown;
};
assert.ok(healthValue.status === "healthy" || healthValue.status === "degraded");
assert.equal(healthValue.snapshotProductCount, productUrls.length);
if (healthValue.fallbackActive === true) {
  assert.ok(Number(healthValue.lastKnownGoodAgeSeconds) < 24 * 60 * 60, "fallback is active too long");
}
console.info(JSON.stringify({
  owner,
  status: "pass",
  productUrls: productUrls.length,
  fallbackActive: healthValue.fallbackActive,
}));
