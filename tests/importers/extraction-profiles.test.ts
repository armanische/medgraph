import assert from "node:assert/strict";
import test from "node:test";

import {
  coverageSummary,
  extractWithCategoryProfiles,
  profileCoverageForCharacteristics,
  selectCategoryExtractionProfiles,
} from "../../scripts/importers/catalog/extraction-profiles/index.ts";
import { normalizeUnit } from "../../scripts/importers/catalog/extraction-profiles/base.ts";
import type { CharacteristicExtractionInput } from "../../scripts/importers/catalog/types.ts";

function input(category: string, text: string): CharacteristicExtractionInput {
  return {
    product: {
      titleFromCatalog: "Test product",
      normalizedTitle: "Test product",
      brandCandidate: "Test",
      modelCandidate: "T1",
      category,
      catalogPage: 1,
      slug: "test-product",
      status: "seed_only",
      needsIndependentResearch: true,
    },
    source: {
      sourceTitle: "Test source",
      sourceUrl: "https://example.org/document.pdf",
      sourceType: "datasheet",
      publisher: "Test",
      detectedManufacturer: "Test",
      detectedModel: "T1",
      confidence: 0.9,
      rankScore: 1,
      reason: "test",
      discoveredAt: "2026-07-10T00:00:00.000Z",
      status: "candidate",
      warnings: [],
    },
    document: {
      documentType: "datasheet",
      title: "Test datasheet",
      url: "https://example.org/document.pdf",
      publisher: "Test",
      mimeType: "application/pdf",
      sizeBytes: 100,
      downloadedAt: "2026-07-10T00:00:00.000Z",
      sha256: "abc",
      artifactPath: "/tmp/test.pdf",
      sourceUrl: "https://example.org/document.pdf",
      status: "candidate",
      warnings: [],
    },
    text,
    extractionMethod: "pdf_text",
  };
}

function values(category: string, text: string) {
  return extractWithCategoryProfiles(input(category, text)).characteristics;
}

test("profile registry selects ventilator by Russian IVL category", () => {
  assert.deepEqual(
    selectCategoryExtractionProfiles("Аппарат ИВЛ").map((profile) => profile.name),
    ["registry", "ventilator"],
  );
});

test("profile registry selects ultrasound", () => {
  assert.ok(
    selectCategoryExtractionProfiles("УЗИ").some((profile) => profile.name === "ultrasound"),
  );
});

test("profile registry selects anesthesia", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Наркозно-дыхательный аппарат").some(
      (profile) => profile.name === "anesthesia",
    ),
  );
});

test("profile registry selects patient monitor", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Монитор пациента").some(
      (profile) => profile.name === "patient-monitor",
    ),
  );
});

test("profile registry selects endoscopy", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Эндоскопия").some(
      (profile) => profile.name === "endoscopy",
    ),
  );
});

test("profile registry selects consumables", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Расходные материалы FS510").some(
      (profile) => profile.name === "consumables",
    ),
  );
});

test("profile registry selects lighting", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Хирургическое освещение").some(
      (profile) => profile.name === "lighting",
    ),
  );
});

test("profile registry selects neonatal", () => {
  assert.ok(
    selectCategoryExtractionProfiles("Инкубатор для новорожденных").some(
      (profile) => profile.name === "neonatal",
    ),
  );
});

test("unit normalization supports weight units", () => {
  assert.equal(normalizeUnit("кг"), "kg");
  assert.equal(normalizeUnit("г"), "g");
});

test("unit normalization supports inches and quotes", () => {
  assert.equal(normalizeUnit('"'), "inch");
  assert.equal(normalizeUnit("inches"), "inch");
});

test("unit normalization supports time units", () => {
  assert.equal(normalizeUnit("hours"), "h");
  assert.equal(normalizeUnit("мин"), "min");
});

test("unit normalization supports medical small units", () => {
  assert.equal(normalizeUnit("мл"), "ml");
  assert.equal(normalizeUnit("мкм"), "µm");
  assert.equal(normalizeUnit("percent"), "%");
});

test("ventilator profile maps weight synonyms", () => {
  const extracted = values("Аппарат ИВЛ", "Device Weight: 6.5 kg");
  const weight = extracted.find((item) => item.matchedPattern === "weight");
  assert.equal(weight?.value, "6.5");
  assert.equal(weight?.unit, "kg");
  assert.equal(weight?.matchedSynonym, "Device Weight");
});

test("ventilator profile maps battery runtime synonyms", () => {
  const battery = values("Ventilator", "Battery Duration: 5 hours").find(
    (item) => item.matchedPattern === "battery_runtime",
  );
  assert.equal(battery?.unit, "h");
  assert.equal(battery?.value, "5");
});

test("ventilator profile extracts NIV and patient groups", () => {
  const extracted = values(
    "Ventilator",
    "Ventilation modes: PCV, NIV. Suitable for neonatal, pediatric and adult patients.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "niv"));
  assert.ok(extracted.some((item) => item.matchedPattern === "neonatal"));
  assert.ok(extracted.some((item) => item.matchedPattern === "pediatric"));
  assert.ok(extracted.some((item) => item.matchedPattern === "adult"));
});

test("ultrasound profile extracts ports and 3D/4D", () => {
  const extracted = values(
    "УЗИ",
    "Probe ports: 4. Color Doppler and 3D/4D imaging are supported.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "probe_ports"));
  assert.ok(extracted.some((item) => item.matchedPattern === "doppler"));
  assert.ok(extracted.some((item) => item.matchedPattern === "3d_4d"));
});

test("patient monitor profile extracts screen and battery", () => {
  const extracted = values(
    "Patient Monitor",
    "Display: 15 inch. Battery Runtime: 4 h. Parameters: ECG, SpO2, NIBP.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "screen"));
  assert.ok(extracted.some((item) => item.matchedPattern === "battery_runtime"));
  assert.ok(extracted.some((item) => item.matchedPattern === "parameters"));
});

test("endoscopy profile extracts dimensions and single-use", () => {
  const extracted = values(
    "Endoscopy",
    "Working channel: 2.8 mm. Outer diameter: 5.4 mm. Single-use sterile device.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "working_channel"));
  assert.ok(extracted.some((item) => item.matchedPattern === "diameter"));
  assert.ok(extracted.some((item) => item.matchedPattern === "single_use"));
  assert.ok(extracted.some((item) => item.matchedPattern === "sterile"));
});

test("consumables profile extracts dead space and filtration", () => {
  const extracted = values(
    "Consumables",
    "Dead space: 45 ml. Filtration efficiency: 99.9%. Connector: 22M/15F.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "dead_space"));
  assert.ok(
    extracted.some((item) => item.matchedPattern === "filtration_efficiency"),
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "connector"));
});

test("lighting profile extracts illumination", () => {
  const extracted = values(
    "Surgical lighting",
    "Illumination: 160 klx. Color temperature: 4500 K.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "illumination"));
  assert.ok(extracted.some((item) => item.matchedPattern === "color_temperature"));
});

test("neonatal profile extracts humidity and alarms", () => {
  const extracted = values(
    "Neonatal incubator",
    "Humidity: 95%. Alarms: temperature, power failure.",
  );
  assert.ok(extracted.some((item) => item.matchedPattern === "humidity"));
  assert.ok(extracted.some((item) => item.matchedPattern === "alarms"));
});

test("extracted characteristics include profile confidence diagnostics", () => {
  const weight = values("Аппарат ИВЛ", "Weight: 7 kg")[0];
  assert.equal(weight.extractionProfile, "ventilator");
  assert.equal(weight.matchedPattern, "weight");
  assert.equal(weight.normalizedUnit, "kg");
  assert.ok(weight.confidence > 0.7);
});

test("coverage reports matched and failed fields", () => {
  const extracted = values("Аппарат ИВЛ", "Weight: 7 kg. Display: 10 inch.");
  const coverage = profileCoverageForCharacteristics({
    category: "Аппарат ИВЛ",
    characteristics: extracted,
  });
  const ventilator = coverage.find((item) => item.profile === "ventilator");
  assert.ok(ventilator);
  assert.ok(ventilator.coveragePercent > 0);
  assert.ok(ventilator.failedFields.includes("battery_runtime"));
});

test("coverage summary aggregates normalized units", () => {
  const extracted = values("Аппарат ИВЛ", "Weight: 7 kg. Display: 10 inch.");
  const summary = coverageSummary(
    profileCoverageForCharacteristics({
      category: "Аппарат ИВЛ",
      characteristics: extracted,
    }),
  );
  assert.equal(summary.normalizedUnits.kg, 1);
  assert.equal(summary.normalizedUnits.inch, 1);
  assert.ok(summary.profilesUsed.includes("ventilator"));
});
