import assert from "node:assert/strict";

import { webkit } from "playwright-core";

const origin = new URL(
  process.env.HOMEPAGE_POLISH_ORIGIN ?? "http://127.0.0.1:3000",
);
const approvedOrigin =
  (origin.protocol === "https:" && (
    origin.hostname === "cyber-medica.ru"
    || origin.hostname === "www.cyber-medica.ru"
    || origin.hostname.endsWith(".vercel.app")
  ))
  || (origin.protocol === "http:"
    && ["127.0.0.1", "localhost"].includes(origin.hostname));

assert.ok(
  approvedOrigin,
  "HOMEPAGE_POLISH_ORIGIN must be an approved public or loopback origin.",
);

const expectedCategories = [
  "ventilators",
  "patient-monitors",
  "syringe-pumps",
  "ultrasound-systems",
  "endoscopy-systems",
  "x-ray-systems",
  "defibrillator-monitors",
  "respiratory-support-devices",
] as const;

const profiles = [
  { name: "desktop-1440", viewport: { width: 1440, height: 900 } },
  { name: "desktop-1280", viewport: { width: 1280, height: 800 } },
  { name: "tablet", viewport: { width: 820, height: 1180 } },
  { name: "iphone", viewport: { width: 390, height: 844 } },
  { name: "mobile-360", viewport: { width: 360, height: 800 } },
] as const;

const browser = await webkit.launch({ headless: true });
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: profile.viewport });
    const page = await context.newPage();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.name));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push("console:error");
    });

    const response = await page.goto(origin.toString(), {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    assert.equal(response?.status(), 200, `${profile.name}: homepage must return 200.`);
    assert.equal(await page.locator("h1").count(), 1, `${profile.name}: one h1 is required.`);
    await page.getByRole("heading", {
      name: "Медицинское оборудование для клиник и медицинских учреждений",
    }).waitFor();

    assert.equal(
      await page.getByRole("link", { name: "Перейти в каталог", exact: true }).first().getAttribute("href"),
      "/catalog",
    );
    assert.equal(
      await page.getByRole("link", { name: "Отправить запрос", exact: true }).first().getAttribute("href"),
      "/request",
    );

    const categoryLinks = page.locator('a[href^="/catalog?category="]');
    const categoryHrefs = await categoryLinks.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")),
    );
    assert.deepEqual(
      categoryHrefs,
      expectedCategories.map((slug) => `/catalog?category=${slug}`),
      `${profile.name}: category links must match the published filter contract.`,
    );

    assert.equal(
      await page.locator('[aria-label="Избранные опубликованные товары"] > li').count(),
      8,
      `${profile.name}: featured selection must remain unchanged.`,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
      `${profile.name}: page must not overflow horizontally.`,
    );

    const undersizedControls = await page.locator(
      'button, .cm-button-primary, .cm-button-secondary, a[href^="/catalog?category="]',
    ).evaluateAll((controls) =>
      controls.filter((control) => {
        const rect = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        if (style.display === "none" || style.visibility === "hidden" || rect.width === 0) return false;
        return rect.height < 44;
      }).map((control) => (control.textContent ?? control.getAttribute("aria-label") ?? "").trim()),
    );
    assert.deepEqual(
      undersizedControls,
      [],
      `${profile.name}: all visible interactive controls must be at least 44px high.`,
    );

    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement !== document.body),
      true,
      `${profile.name}: keyboard focus must enter the page.`,
    );
    assert.deepEqual(runtimeErrors, [], `${profile.name}: WebKit runtime errors detected.`);
    await context.close();
  }
  console.info(`Homepage polish smoke passed for ${profiles.length} WebKit profiles.`);
} finally {
  await browser.close();
}
