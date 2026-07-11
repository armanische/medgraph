import assert from "node:assert/strict";
import test from "node:test";

import {
  DefaultProvider,
  DragerProvider,
  providerForManufacturer,
} from "../../scripts/importers/catalog/providers/index.ts";

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
    portal.section === "customer_portal" &&
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
  assert.deepEqual(diagnostics.unsupportedPortals, [
    "https://www.draeger.com/customer-portal/login",
  ]);
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
