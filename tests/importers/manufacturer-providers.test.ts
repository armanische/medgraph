import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  DefaultProvider,
  DragerProvider,
  providerForManufacturer,
} from "../../scripts/importers/catalog/providers/index.ts";
import {
  discoverProduct,
  MockDiscoveryProvider,
  runDiscoveryForProducts,
  type DiscoveryProductInput,
} from "../../scripts/importers/catalog/discovery.ts";

test("provider selection supports configured manufacturer aliases", () => {
  assert.equal(providerForManufacturer("Hamilton Medical").name, "hamilton");
  assert.equal(providerForManufacturer("Mindray").name, "mindray");
  assert.equal(providerForManufacturer("Ambu A/S").name, "ambu");
  assert.equal(providerForManufacturer("Dräger").name, "drager");
  assert.equal(providerForManufacturer("Draeger").name, "drager");
  assert.equal(providerForManufacturer("Philips Healthcare").name, "philips");
  assert.equal(providerForManufacturer("GE HealthCare").name, "ge-healthcare");
});

test("URL normalization upgrades HTTPS, removes tracking and uses canonical URL", () => {
  const provider = new DragerProvider();
  const result = provider.normalizeUrls([
    { url: "http://WWW.DRAEGER.COM/en_us/Products/Test/?utm_source=test#downloads" },
    {
      url: "https://www.draeger.com/redirect?id=7",
      canonicalUrl: "https://www.draeger.com/en_us/Products/Test",
    },
  ]);

  assert.deepEqual(result.urls, ["https://www.draeger.com/en_us/Products/Test"]);
  assert.equal(result.duplicatesRemoved, 1);
  assert.deepEqual(result.blockedUrls, []);
});

test("regional site resolution preserves regional URL and identifies locale", () => {
  const provider = new DragerProvider();
  assert.deepEqual(provider.resolveRegionalSites([
    { url: "https://www.draeger.com/en-us_us/Products" },
    { url: "https://www.draeger.com/de_de/Products" },
  ]), [
    { url: "https://www.draeger.com/en-us_us/Products", region: "en-us_us", official: true },
    { url: "https://www.draeger.com/de_de/Products", region: "de_de", official: true },
  ]);
});

test("duplicate removal occurs after canonical normalization", () => {
  const provider = new DragerProvider();
  const result = provider.normalizeUrls([
    { url: "https://draeger.com/Products?utm_medium=email" },
    { url: "https://draeger.com/Products#top" },
    { url: "https://draeger.com/Products/" },
  ]);
  assert.deepEqual(result.urls, ["https://draeger.com/Products"]);
  assert.equal(result.duplicatesRemoved, 2);
});

test("portal detection reports customer portals without authorizing access", () => {
  const provider = new DragerProvider();
  const portals = provider.detectDocumentPortals([
    { url: "https://www.draeger.com/ifu" },
    { url: "https://www.draeger.com/customer-portal/login" },
  ]);
  assert.equal(portals.length, 2);
  assert.ok(portals.some((portal) => portal.supported));
  assert.ok(portals.some((portal) =>
    portal.portalType === "customer_portal" &&
    portal.requiresAuthentication &&
    !portal.supported,
  ));
});

test("unknown manufacturer receives fallback provider", () => {
  assert.ok(providerForManufacturer("Unknown Medical") instanceof DefaultProvider);
  assert.equal(providerForManufacturer(null).name, "default");
});

test("diagnostics report normalization, blocks and unsupported portals", () => {
  const provider = new DragerProvider();
  const diagnostics = provider.diagnostics({
    manufacturer: "Dräger",
    urls: [
      { url: "http://www.draeger.com/en_us/Products" },
      { url: "https://www.draeger.com/en_us/Products?utm_source=test" },
      { url: "https://www.draeger.com/customer-portal/login" },
      { url: "file:///private/manual.pdf" },
    ],
  });

  assert.equal(diagnostics.providerName, "drager");
  assert.match(diagnostics.strategyUsed, /technical documentation/iu);
  assert.equal(diagnostics.duplicatesRemoved, 1);
  assert.deepEqual(diagnostics.blockedUrls, ["file:///private/manual.pdf"]);
  assert.equal(diagnostics.unsupportedPortals.length, 1);
  assert.equal(
    diagnostics.unsupportedPortals[0]?.url,
    "https://www.draeger.com/customer-portal/login",
  );
  assert.equal(diagnostics.pagesVisited.length, 2);
});

test("provider discovery methods classify official sections independently", () => {
  const provider = providerForManufacturer("Philips Healthcare");
  const input = {
    manufacturer: "Philips Healthcare",
    urls: [
      { url: "https://www.philips.com/healthcare/products" },
      { url: "https://www.philips.com/healthcare/resources/documentation" },
      { url: "https://www.philips.com/healthcare/downloads" },
      { url: "https://dealer.example/philips/downloads" },
    ],
  };
  assert.equal(provider.discoverOfficialPages(input).length, 1);
  assert.equal(provider.discoverDocumentation(input).length, 1);
  assert.equal(provider.discoverDownloads(input).length, 1);
});

const integrationProduct: DiscoveryProductInput = {
  productSlug: "provider-diagnostics-fixture",
  manufacturer: "Unknown Medical",
  productName: "Unknown Monitor",
  model: "U-1",
  category: "Мониторы пациента",
};

test("fallback diagnostics do not change source trust tier or discovery result", async () => {
  const report = await discoverProduct(
    integrationProduct,
    new MockDiscoveryProvider({
      sources: async (product) => [{
        sourceId: "fallback-source",
        productSlug: product.productSlug,
        manufacturer: product.manufacturer,
        productName: product.productName,
        sourceType: "official_manufacturer_page",
        url: "https://unknown.example/products/u-1?utm_source=test",
        title: "Unknown U-1",
        snippet: "Candidate only",
        discoveredBy: "fixture",
        confidence: 0.45,
        trustTier: 3,
        requiresHumanReview: true,
        reasons: ["fixture"],
      }],
    }),
    null,
  );

  assert.equal(report.providerDiagnostics.providerName, "default");
  assert.equal(report.providerSelectedAutomatically, true);
  assert.equal(report.fallbackProviderUsed, true);
  assert.equal(report.sourceCandidates[0]?.trustTier, 3);
  assert.equal(report.sourceCandidates[0]?.url, "https://unknown.example/products/u-1?utm_source=test");
  assert.deepEqual(report.providerDiagnostics.normalizedUrls, [
    "https://unknown.example/products/u-1",
  ]);
  assert.ok(report.providerDiagnostics.warnings.some((warning) =>
    warning.includes("without changing trust tier"),
  ));
});

test("aggregate provider diagnostics count providers, fallback and URL outcomes", async () => {
  const root = await mkdtemp(join(tmpdir(), "provider-diagnostics-"));
  const products: DiscoveryProductInput[] = [
    { ...integrationProduct, manufacturer: "Dräger", productSlug: "drager-fixture" },
    integrationProduct,
  ];
  const provider = new MockDiscoveryProvider({
    sources: async (product) => [{
      sourceId: `${product.productSlug}-source`,
      productSlug: product.productSlug,
      manufacturer: product.manufacturer,
      productName: product.productName,
      sourceType: "official_manufacturer_page",
      url: product.manufacturer === "Dräger"
        ? "http://www.draeger.com/customer-portal/login?utm_source=test"
        : "file:///blocked.pdf",
      title: "Fixture source",
      snippet: "Candidate only",
      discoveredBy: "fixture",
      confidence: 0.45,
      trustTier: 3,
      requiresHumanReview: true,
      reasons: ["fixture"],
    }],
  });
  const result = await runDiscoveryForProducts({
    products,
    provider,
    resolver: null,
    productReportDirectory: join(root, "products"),
    aggregateReportPath: join(root, "aggregate.json"),
  });

  assert.deepEqual(result.aggregate.providersUsed, ["default", "drager"]);
  assert.deepEqual(result.aggregate.productsPerProvider, { drager: 1, default: 1 });
  assert.equal(result.aggregate.fallbackProviderProducts, 1);
  assert.equal(result.aggregate.totalCandidateUrls, 2);
  assert.equal(result.aggregate.totalNormalizedUrls, 1);
  assert.equal(result.aggregate.totalBlockedUrls, 1);
  assert.equal(result.aggregate.unsupportedPortalsDetected, 1);
  assert.ok(result.aggregate.providerWarnings.length >= 2);
});

test("provider diagnostics integration contains no forbidden writers", async () => {
  const sources = await Promise.all([
    readFile("scripts/importers/catalog/discovery.ts", "utf8"),
    readFile("scripts/importers/catalog/providers/base-provider.ts", "utf8"),
    readFile("scripts/importers/catalog/providers/index.ts", "utf8"),
  ]);
  const implementation = sources.join("\n");
  assert.doesNotMatch(implementation, /from ["'][^"']*supabase/iu);
  assert.doesNotMatch(implementation, /createVerifiedClaim|createPublication|ReviewDecision/iu);
});
