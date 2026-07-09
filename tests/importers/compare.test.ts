import assert from "node:assert/strict";
import test from "node:test";

import { compareProducts } from "../../lib/compare/engine.ts";
import type {
  ComparisonCharacteristic,
  ComparisonProduct,
} from "../../lib/compare/types.ts";

function characteristic(
  key: string,
  value: string | number,
  unit: string | null = null,
): ComparisonCharacteristic {
  return {
    key,
    label: key,
    group: "Test",
    value: {
      value,
      unit,
      status: "publication_ready",
      source: {
        id: `source_${key}`,
        title: `Source ${key}`,
        url: `https://example.org/${key}`,
        type: "manufacturer_document",
      },
      documentVersion: {
        id: `version_${key}`,
        title: `Document ${key}`,
        version: "sha256:test",
        sha256: "a".repeat(64),
      },
      evidenceIds: [`evidence_${key}`],
      confidence: 0.9,
      lastUpdated: "2026-07-09",
    },
  };
}

function product(
  slug: string,
  characteristics: ComparisonCharacteristic[],
): ComparisonProduct {
  return {
    productId: slug,
    slug,
    title: slug,
    manufacturer: "Hamilton Medical",
    model: slug,
    category: "Аппараты ИВЛ",
    dataSource: "publication_ready_report",
    characteristics,
  };
}

test("comparison aligns identical characteristics", () => {
  const result = compareProducts({
    left: product("left", [characteristic("display", 8.4, "inch")]),
    right: product("right", [characteristic("display", 8.4, "inch")]),
  });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].differenceType, "same");
  assert.equal(result.rows[0].hasDifference, false);
});

test("comparison detects different values", () => {
  const result = compareProducts({
    left: product("left", [characteristic("intended_use", "Transport")]),
    right: product("right", [characteristic("intended_use", "ICU")]),
  });

  assert.equal(result.summary.differences, 1);
  assert.equal(result.rows[0].differenceType, "different");
});

test("comparison does not count missing data as difference", () => {
  const result = compareProducts({
    left: product("left", [characteristic("neonatal_support", "Yes")]),
    right: product("right", []),
  });

  assert.equal(result.summary.missingValues, 1);
  assert.equal(result.summary.differences, 0);
  assert.equal(result.rows[0].hasDifference, false);
});

test("comparison marks unit mismatch without conversion", () => {
  const result = compareProducts({
    left: product("left", [characteristic("weight", 6.5, "kg")]),
    right: product("right", [characteristic("weight", 6500, "g")]),
  });

  assert.equal(result.summary.unitMismatches, 1);
  assert.equal(result.rows[0].differenceType, "unit_mismatch");
});

test("comparison rejects Candidate Claims as source", () => {
  const unsafeProduct: ComparisonProduct = {
    ...product("candidate", [characteristic("display", 8.4, "inch")]),
    dataSource: "candidate_claims",
  };

  assert.throws(
    () =>
      compareProducts({
        left: unsafeProduct,
        right: product("right", [characteristic("display", 8.4, "inch")]),
      }),
    /not allowed/,
  );
});

test("comparison result is idempotent", () => {
  const input = {
    left: product("left", [characteristic("display", 8.4, "inch")]),
    right: product("right", [characteristic("display", 8.4, "inch")]),
  };

  assert.deepEqual(compareProducts(input), compareProducts(input));
});
