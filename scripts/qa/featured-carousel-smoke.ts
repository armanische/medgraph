import assert from "node:assert/strict";

import { webkit } from "playwright-core";

const origin = new URL(process.env.FEATURED_CAROUSEL_ORIGIN ?? "http://127.0.0.1:3000");
const approvedOrigin =
  (origin.protocol === "https:" && (
    origin.hostname === "cyber-medica.ru"
    || origin.hostname === "www.cyber-medica.ru"
    || origin.hostname.endsWith(".vercel.app")
  ))
  || (origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname));

assert.ok(approvedOrigin, "FEATURED_CAROUSEL_ORIGIN must be an approved public or loopback origin.");

const expectedPaths = [
  "/catalog/767632362-330695211247-apparat-ivl-hamilton-t1",
  "/catalog/767632362-401374530532-apparat-ivl-mindray-sv300",
  "/catalog/767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia",
  "/catalog/767632362-725867191732-defibrillyator-monitor-mnogofunktsionaln",
  "/catalog/767632362-358648454622-uzi-apparat-ge-versana-premier-black",
  "/catalog/767632362-571191341342-rentgenohirurgicheskii-apparat-tipa-s-du",
  "/catalog/767632362-601909099101-gemodializnii-apparat-iskusstvennaya-poc",
  "/catalog/767632362-446510199362-videoendoskopicheskaya-sistema-pentax-ep",
] as const;

const profiles = [
  { name: "iPhone portrait", viewport: { width: 390, height: 844 }, expectedVisibleCards: 1 },
  { name: "tablet", viewport: { width: 820, height: 1180 }, expectedVisibleCards: 2 },
  { name: "desktop", viewport: { width: 1440, height: 900 }, expectedVisibleCards: 4 },
] as const;

const browser = await webkit.launch({ headless: true });
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: profile.viewport });
    const page = await context.newPage();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.name));

    const response = await page.goto(origin.toString(), {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    assert.equal(response?.status(), 200, `${profile.name}: homepage must return 200.`);

    const section = page.locator('[aria-labelledby="homepage-equipment-title"]');
    await section.scrollIntoViewIfNeeded();
    await page.getByRole("heading", { name: "Популярное медицинское оборудование" }).waitFor();
    const cards = page.locator('[aria-label="Избранные опубликованные товары"] > li');
    assert.equal(await cards.count(), expectedPaths.length, `${profile.name}: expected eight cards.`);

    const paths = await cards.locator("a").evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
    assert.deepEqual(paths, [...expectedPaths], `${profile.name}: canonical paths must match.`);

    const visibleCards = await cards.evaluateAll((items) => items.filter((item) => {
      const rect = item.getBoundingClientRect();
      return rect.left >= 0 && rect.left < window.innerWidth;
    }).length);
    assert.equal(visibleCards, profile.expectedVisibleCards, `${profile.name}: visible card count drifted.`);

    const track = page.locator('[aria-label="Избранные опубликованные товары"]');
    const before = await track.evaluate((element) => element.scrollLeft);
    await page.getByRole("button", { name: "Следующие товары" }).click();
    await page.waitForTimeout(500);
    const afterButton = await track.evaluate((element) => element.scrollLeft);
    assert.ok(afterButton > before, `${profile.name}: next button must move the track.`);

    await track.focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    const afterKeyboard = await track.evaluate((element) => element.scrollLeft);
    assert.ok(afterKeyboard < afterButton, `${profile.name}: keyboard must move the track.`);

    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
      `${profile.name}: page must not have horizontal overflow.`,
    );
    assert.deepEqual(runtimeErrors, [], `${profile.name}: WebKit runtime errors detected.`);
    await context.close();
  }
  console.info(`Featured carousel smoke passed for ${profiles.length} responsive WebKit profiles.`);
} finally {
  await browser.close();
}
