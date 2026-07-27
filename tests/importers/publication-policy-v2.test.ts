import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EDITORIAL_WARNING_CODES,
  isEditorialWarningCode,
  partitionEditorialDiagnostics,
} from "../../lib/editorial-diagnostics-policy.ts";

test("Publication Policy v2 classifies only editorial completeness diagnostics as warnings", () => {
  assert.deepEqual(EDITORIAL_WARNING_CODES, [
    "missing_registration",
    "missing_documents",
    "missing_manual",
    "missing_brochure",
    "missing_datasheet",
  ]);

  for (const code of EDITORIAL_WARNING_CODES) {
    assert.equal(isEditorialWarningCode(code), true);
  }

  for (const structuralCode of [
    "missing_product_identity",
    "missing_model",
    "missing_manufacturer",
    "missing_category",
    "missing_application_area",
    "duplicate_identity",
    "duplicate_slug",
    "unresolved_import_conflict",
    "invalid_characteristics",
    "review_not_approved",
    "publication_not_approved",
  ]) {
    assert.equal(isEditorialWarningCode(structuralCode), false);
  }
});

test("editorial warning partitioning is deterministic and never consumes structural diagnostics", () => {
  assert.deepEqual(
    partitionEditorialDiagnostics([
      "missing_registration",
      "missing_category",
      "missing_datasheet",
      "review_not_approved",
    ]),
    {
      warnings: ["missing_registration", "missing_datasheet"],
      otherDiagnostics: ["missing_category", "review_not_approved"],
    },
  );
});

test("existing Cloud contracts keep editorial diagnostics visible but outside structural eligibility", async () => {
  const [importMigration, qualityAlignment, publicationFoundation, adminMigration, policy] = await Promise.all([
    readFile("supabase/migrations/202607200004_product_import_v1.sql", "utf8"),
    readFile("supabase/migrations/202607210002_catalog_data_quality_editor_alignment.sql", "utf8"),
    readFile("supabase/migrations/202607260001_product_publication_foundation_corrective_v1.sql", "utf8"),
    readFile("supabase/migrations/202607200005_catalog_admin_v1.sql", "utf8"),
    readFile("docs/04-data/publication-policy-v2.md", "utf8"),
  ]);

  assert.match(importMigration, /case when missing_registration_value then 'missing_registration' end/u);
  assert.match(importMigration, /case when missing_documents_value then 'missing_documents' end/u);
  assert.match(importMigration, /insert into cloud\.import_warnings/u);
  assert.doesNotMatch(importMigration, /insert into cloud\.import_blocking_errors[\s\S]{0,500}'missing_registration'/u);
  assert.doesNotMatch(importMigration, /insert into cloud\.import_blocking_errors[\s\S]{0,500}'missing_documents'/u);

  const identityReasons = qualityAlignment.match(/\], null\), array_remove\(array\[([\s\S]*?)\], null\) into reasons, identity_reasons/u)?.[1] ?? "";
  assert.match(identityReasons, /UNKNOWN_MANUFACTURER/u);
  assert.match(identityReasons, /UNKNOWN_CATEGORY/u);
  assert.match(identityReasons, /MODEL_NOT_EXPLICIT_IN_SOURCE/u);
  assert.doesNotMatch(identityReasons, /MISSING_(?:REGISTRATION|DOCUMENTS)/u);

  assert.doesNotMatch(publicationFoundation, /missing_(?:registration|documents|manual|brochure|datasheet)/u);
  assert.match(publicationFoundation, /product application areas are missing or unpublished/u);
  assert.match(adminMigration, /'severity', 'warning'/u);
  assert.match(policy, /application area.*structural invariant/iu);
  assert.match(policy, /must not change Publication Eligibility/u);
});
