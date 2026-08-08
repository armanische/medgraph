import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

import { chromium, webkit, type BrowserType, type Page } from "playwright-core";

import stageCatalog from "../../data/import/endomarket-wave1-stage-catalog.json" with { type: "json" };

const origin = new URL(
  process.env.ENDOMARKET_STAGE_ORIGIN ?? "http://127.0.0.1:3100",
);
const approvedOrigin =
  (origin.protocol === "https:" && origin.hostname.endsWith(".vercel.app"))
  || (origin.protocol === "http:"
    && ["127.0.0.1", "localhost"].includes(origin.hostname));

assert.ok(approvedOrigin, "ENDOMARKET_STAGE_ORIGIN must be a loopback or Vercel Preview origin.");
assert.equal(stageCatalog.summary.normalizedEquipmentRows, 51);
assert.equal(stageCatalog.summary.newDraftCandidates, 42);
assert.equal(stageCatalog.summary.existingDuplicateBindings, 9);

const newProducts = stageCatalog.products.filter((product) => !product.published);
const detailProducts = [
  "medinova-endo-clean-1000",
  "medinova-endo-clean-2000",
  "medinova-ec-5bd",
  "medinova-br-1231",
  "medinova-br-1242",
  "sonoscape-eg-500",
  "erbe-vio-3",
  "bowa-arc-400",
  "ilivtouch-ilivtouch",
  "met-ks-350",
] as const;

for (const slug of detailProducts) {
  assert.ok(newProducts.some((product) => product.slug === slug), `${slug}: missing Stage Product.`);
}

const evidenceDir = "docs/reports/evidence/endomarket-business-content-corrective-v2-2026-08-08";
const captureScreenshots = process.env.ENDOMARKET_STAGE_SCREENSHOTS === "1";
if (captureScreenshots) await mkdir(evidenceDir, { recursive: true });

const runtimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`${error.name}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const isPreviewToolbarCsp = origin.hostname.endsWith(".vercel.app")
      && message.text().includes("https://vercel.live/_next-live/feedback/feedback.js");
    if (!isPreviewToolbarCsp) errors.push(`console:error: ${message.text()}`);
  });
  return errors;
};

async function assertPage(page: Page, path: string, label: string) {
  const response = await page.goto(new URL(path, origin).toString(), {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  assert.equal(response?.status(), 200, `${label}: ${path} must return HTTP 200.`);
  assert.ok((await page.locator("body").innerText()).trim().length > 100, `${label}: ${path} is blank.`);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    true,
    `${label}: ${path} must not overflow horizontally.`,
  );
  assert.equal(
    await page.locator('[aria-label="Загрузка страницы"]').count(),
    0,
    `${label}: ${path} left a streaming fallback mounted.`,
  );
}

async function runProfile(
  browserType: BrowserType,
  label: string,
  viewport: { width: number; height: number },
) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = runtimeErrors(page);

  try {
    await assertPage(page, "/", label);
    await page.getByRole("heading", {
      name: "Сервис и сопровождение оборудования",
    }).waitFor();
    const popularSection = page.getByRole("region", {
      name: "Популярное медицинское оборудование",
    });
    await popularSection.waitFor();
    assert.equal(
      await popularSection.getByRole("link", { name: /^Подробнее о /u }).count(),
      8,
      `${label}: homepage must render exactly eight clean featured cards.`,
    );
    await page.getByText(
      "Оборудование для эндоскопии, диагностики и оснащения клиник — в наличии и с рассрочкой 0%.",
      { exact: true },
    ).waitFor();

    if (captureScreenshots && label === "chromium-desktop-1440") {
      await page.screenshot({ path: `${evidenceDir}/homepage-desktop-1440.png`, fullPage: true });
      await page.getByRole("heading", { name: "Сервис и сопровождение оборудования" })
        .locator("..")
        .screenshot({ path: `${evidenceDir}/service-benefit-desktop.png` });
    }

    await assertPage(page, "/catalog", label);
    await page.getByRole("heading", { name: "Каталог медицинских изделий" }).waitFor();
    assert.ok(
      (await page.getByText("В наличии", { exact: true }).count()) >= 51,
      `${label}: all 51 Stage cards must show availability.`,
    );
    assert.ok(
      (await page.getByText("Рассрочка 0%", { exact: true }).count()) >= 51,
      `${label}: all 51 Stage cards must show installment terms.`,
    );
    const bodyText = await page.locator("body").innerText();
    assert.doesNotMatch(bodyText, /Made on Tilda|medvist\.ru|publication_status|review_state/ui);
    assert.doesNotMatch(bodyText, /щипцы|клапан для эндоскопа|моющее средство/ui);
    assert.doesNotMatch(
      bodyText,
      /Профессиональное медицинское применение|Надежное решение для медицинских учреждений|Используется в клинической практике/iu,
    );
    assert.equal(
      await page.locator("article dl").count(),
      0,
      `${label}: catalog ProductCard must not render technical characteristics.`,
    );
    assert.equal(
      await page.locator('img[src*="%2Fmedia%2Fendomarket-wave1%2F"]').count() > 0,
      true,
      `${label}: Stage catalog must use downloaded local EndoMarket media.`,
    );

    if (captureScreenshots && label === "chromium-desktop-1280") {
      await page.screenshot({ path: `${evidenceDir}/catalog-desktop-1280.png`, fullPage: true });
      await page.locator("article").first().screenshot({ path: `${evidenceDir}/product-card-commercial-badges.png` });
    }
    if (captureScreenshots && label === "webkit-iphone-portrait") {
      await page.screenshot({ path: `${evidenceDir}/catalog-mobile-390x844.png`, fullPage: true });
    }

    await assertPage(page, "/search?q=sonoscape", label);
    assert.ok((await page.getByText(/SonoScape/u).count()) > 0, `${label}: Stage search must find SonoScape.`);

    await assertPage(page, "/manufacturers/medinova", label);
    assert.ok((await page.getByText(/Medinova/u).count()) > 0, `${label}: manufacturer page must render.`);

    await assertPage(page, "/request", label);

    for (const slug of detailProducts) {
      await assertPage(page, `/catalog/${slug}`, label);
      assert.equal(await page.getByText("В наличии", { exact: true }).count() > 0, true, `${slug}: availability badge missing.`);
      assert.equal(await page.getByText(/^Рассрочка 0%/u).count() > 0, true, `${slug}: installment badge missing.`);
      assert.equal(await page.getByText("До 12 месяцев без удорожания", { exact: true }).count() > 0, true, `${slug}: installment description missing.`);
      assert.equal(await page.locator('a[href^="/request?"]').count() > 0, true, `${slug}: RFQ action missing.`);
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /Страна не указана|Профессиональное медицинское применение|Надежное решение для медицинских учреждений|Используется в клинической практике/iu,
      );
    }

    if (captureScreenshots && label === "chromium-desktop-1440") {
      await page.goto(new URL(`/catalog/${detailProducts[0]}`, origin).toString(), { waitUntil: "networkidle" });
      await page.screenshot({ path: `${evidenceDir}/product-detail-desktop.png`, fullPage: true });
    }
    if (captureScreenshots && label === "webkit-iphone-portrait") {
      await page.goto(new URL(`/catalog/${detailProducts[2]}`, origin).toString(), { waitUntil: "networkidle" });
      await page.screenshot({ path: `${evidenceDir}/product-detail-mobile-390x844.png`, fullPage: true });
    }

    assert.deepEqual(errors, [], `${label}: browser runtime errors detected.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await runProfile(chromium, "chromium-desktop-1440", { width: 1440, height: 900 });
await runProfile(chromium, "chromium-desktop-1280", { width: 1280, height: 800 });
await runProfile(chromium, "chromium-tablet-820", { width: 820, height: 1180 });
await runProfile(webkit, "webkit-iphone-portrait", { width: 390, height: 844 });
await runProfile(webkit, "webkit-iphone-landscape", { width: 844, height: 390 });

const requestApi = await fetch(new URL("/api/request", origin), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
});
assert.equal(requestApi.status, 405, "GET /api/request must remain HTTP 405.");

console.info(
  `EndoMarket Stage smoke passed: 5 profiles, ${detailProducts.length} Product Detail routes, 42 drafts and 9 duplicate bindings.`,
);
