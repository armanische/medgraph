import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSearchIndex,
  searchMedicalDevices,
  type SearchIndexDocument,
} from "../../lib/search/index.ts";

test("search ranks exact model match higher", () => {
  const result = searchMedicalDevices("Hamilton T1");

  assert.ok(result.results.length >= 1);
  assert.equal(result.results[0].model, "HAMILTON-T1");
});

test("search finds products by manufacturer", () => {
  const result = searchMedicalDevices("Hamilton");

  assert.ok(result.results.some((item) => item.manufacturer === "Hamilton Medical"));
});

test("search supports multiple words", () => {
  const result = searchMedicalDevices("Hamilton ИВЛ");

  assert.ok(result.results.some((item) => item.title === "Hamilton T1"));
  assert.ok(result.results.some((item) => item.title === "Hamilton C1"));
});

test("search returns suggestions for empty query", () => {
  const result = searchMedicalDevices("");

  assert.equal(result.total, 0);
  assert.equal(result.results.length, 0);
  assert.ok(result.suggestions.includes("Hamilton T1"));
});

test("search returns no results for unknown query", () => {
  const result = searchMedicalDevices("unknown-device-query");

  assert.equal(result.total, 0);
});

test("search never indexes Candidate Claims", () => {
  const candidateDocument: SearchIndexDocument = {
    id: "candidate:test",
    slug: "candidate",
    title: "Candidate Claim Device",
    manufacturer: "Candidate",
    model: "CANDIDATE-1",
    category: "Internal",
    registrationNumber: null,
    sku: null,
    aliases: ["candidate"],
    synonyms: [],
    status: "publication_ready",
    lastUpdated: "2026-07-09",
    href: "/internal",
    sourceKind: "candidate_claim",
  };
  const result = searchMedicalDevices("CANDIDATE-1", [
    ...buildSearchIndex(),
    candidateDocument,
  ]);

  assert.equal(result.results.some((item) => item.id === candidateDocument.id), false);
});

test("search ranking is deterministic", () => {
  assert.deepEqual(searchMedicalDevices("Hamilton"), searchMedicalDevices("Hamilton"));
});

test("search finds registration number", () => {
  const result = searchMedicalDevices("ФСЗ 2009/04992");

  assert.equal(result.results[0].title, "Тепловлагообменный фильтр FS510");
});
