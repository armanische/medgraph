import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

import {
  auditPublishedCatalog,
  buildFirstPublicationCandidateReport,
  buildPublishedCatalog,
  publicSlug,
  publishCatalog,
  validatePublishedCatalog,
  type PublicationBuildInput,
} from "../../scripts/importers/catalog/publication/index.ts";
import { FIRST_PUBLICATION_PRODUCT_SLUGS } from "../../scripts/importers/catalog/review/index.ts";
import { getCatalogCardsWithFallback } from "../../lib/published-catalog.ts";
import {
  createReviewItemSnapshot,
  evaluateItemPublicationEligibility,
} from "../../scripts/importers/catalog/review/index.ts";

function fixtureInput(overrides?: {
  status?: string;
  decision?: "approve" | "reject" | "mark_conflict" | "none";
  evidence?: string[];
  versions?: string[];
  sources?: string[];
  integrity?: PublicationBuildInput["integrityViolations"];
}): PublicationBuildInput {
  const input: PublicationBuildInput = {
    generatedAt: "2026-07-16T00:00:00.000Z",
    reviewProducts: [
      {
        product: {
          productSlug: "test-medical-device",
          manufacturer: "Тест Медикал",
          productName: "Test Medical Device 100",
          model: "TMD-100",
          category: "Мониторы пациентов",
        },
        reviewItems: [
          {
            reviewItemId: "review-ready-1",
            productSlug: "test-medical-device",
            productTitle: "Test Medical Device 100",
            suggestedClaimType: "product.weight",
            valuePayload: { value: "3.5", unit: "kg" },
            evidenceCandidateIds: overrides?.evidence ?? ["evidence-1"],
            documentVersionIds: overrides?.versions ?? ["version-1"],
            sourceUrls: overrides?.sources ?? ["https://manufacturer.example/manual.pdf"],
            status: overrides?.status ?? "READY",
            updatedAt: "2026-07-15T10:00:00.000Z",
          },
          {
            reviewItemId: "review-ready-compatibility",
            productSlug: "test-medical-device",
            productTitle: "Test Medical Device 100",
            suggestedClaimType: "product.compatibility",
            valuePayload: { value: "Module A", unit: null },
            evidenceCandidateIds: ["evidence-2"],
            documentVersionIds: ["version-1"],
            sourceUrls: ["https://manufacturer.example/manual.pdf"],
            status: overrides?.status ?? "READY",
            updatedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
        sourceDocumentSummary: [
          {
            documentVersionId: "version-1",
            documentType: "operator_manual",
            title: "Operator manual",
            sourceUrl: "https://manufacturer.example/manual.pdf",
            sha256: "a".repeat(64),
          },
        ],
      },
    ],
    decisions: [],
    artifacts: [
      {
        sha256: "a".repeat(64),
        referencedDocumentVersions: ["version-1"],
        referencedReviewItems: ["review-ready-1", "review-ready-compatibility"],
        orphan: false,
        invalidPdf: false,
        htmlMasquerading: false,
        zeroByte: false,
        shaMatchesPath: true,
      },
    ],
    integrityViolations: overrides?.integrity ?? [],
  };
  if (overrides?.decision !== "none") {
    const report = input.reviewProducts[0];
    input.decisions = report.reviewItems.map((item, index) => {
      const snapshot = createReviewItemSnapshot({
        report,
        item,
        artifacts: input.artifacts,
        integrityViolations: input.integrityViolations,
      });
      const decision = (overrides?.decision ?? "approve") as
        "approve" | "reject" | "mark_conflict";
      return {
        id: `decision-${index}`,
        reviewItemId: item.reviewItemId,
        productSlug: report.product.productSlug,
        decision,
        nextStatus:
          decision === "approve"
            ? "approved"
            : decision === "reject"
              ? "rejected"
              : "conflicted",
        reviewedAt: "2026-07-16T00:00:00.000Z",
        snapshotHash: snapshot.hash,
        publicationEligibility:
          decision === "approve"
            ? evaluateItemPublicationEligibility(snapshot)
            : { eligible: false, status: "not_ready", reasons: [decision] },
      };
    });
  }
  return input;
}

test("latest approved Review Items create one public-safe product", () => {
  const result = buildPublishedCatalog(fixtureInput());
  assert.equal(result.catalog.kpi.publishedProducts, 1);
  assert.equal(result.catalog.kpi.publishedItems, 2);
  assert.deepEqual(result.catalog.products[0].compatibility, ["Module A"]);
  const product = result.catalog.products[0];
  const serialized = JSON.stringify(product);
  assert.deepEqual(Object.keys(product).sort(), [
    "category", "categorySlug", "compatibility", "coverage", "description",
    "documents", "id", "manufacturer", "manufacturerSlug", "model", "name",
    "officialSources", "slug", "specifications", "status", "updatedAt",
    "verificationLevel",
  ].sort());
  assert.doesNotMatch(serialized, /review-ready|evidence-1|version-1|sha256|artifact|comment|internal/iu);
  assert.doesNotMatch(serialized, /[a-f0-9]{64}/iu);
  assert.equal(product.documents[0].url, product.officialSources[0].url);
  assert.equal(validatePublishedCatalog(result.catalog).valid, true);
});

test("records without human approval and missing evidence records are blocked", () => {
  const pending = buildPublishedCatalog(fixtureInput({ decision: "none" }));
  assert.equal(pending.catalog.kpi.publishedProducts, 0);
  assert.equal(pending.catalog.blockedByReason.not_ready, 2);

  const missing = buildPublishedCatalog(fixtureInput({ evidence: [] }));
  assert.equal(missing.catalog.kpi.publishedProducts, 0);
  assert.equal(missing.catalog.blockedByReason.missing_evidence, 1);
});

test("rejected review records are never published", () => {
  const result = buildPublishedCatalog(fixtureInput({ decision: "reject" }));
  assert.equal(result.catalog.kpi.publishedProducts, 0);
  assert.equal(result.catalog.kpi.rejected, 2);
});

test("only the latest decision controls publication", () => {
  const input = fixtureInput();
  input.decisions.push(
    ...input.decisions.map((decision, index) => ({
      ...decision,
      id: `newer-rejection-${index}`,
      decision: "reject" as const,
      nextStatus: "rejected" as const,
      reviewedAt: "2026-07-17T00:00:00.000Z",
      publicationEligibility: {
        eligible: false,
        status: "not_ready" as const,
        reasons: ["rejected"],
      },
    })),
  );
  const result = buildPublishedCatalog(input);
  assert.equal(result.catalog.kpi.publishedProducts, 0);
  assert.equal(result.catalog.kpi.rejected, 2);
});

test("stale approval blocks publication", () => {
  const input = fixtureInput();
  input.decisions[0].snapshotHash = "0".repeat(64);
  const result = buildPublishedCatalog(input);
  assert.equal(result.catalog.kpi.publishedProducts, 0);
  assert.equal(result.catalog.blockedByReason.stale_approval, 1);
});

test("invalid decision timestamps fail closed", () => {
  const input = fixtureInput();
  input.decisions[0].reviewedAt = "not-a-timestamp";
  const result = buildPublishedCatalog(input);
  assert.equal(result.catalog.kpi.publishedProducts, 0);
  assert.equal(result.catalog.blockedByReason.invalid_decision, 1);
});

test("first publication selection is explicit and never creates approvals", () => {
  assert.deepEqual(FIRST_PUBLICATION_PRODUCT_SLUGS, [
    "wave2-philips-intellivue-mx400",
    "wave2-ge-carescape-b450",
    "wave2-hamilton-h900",
    "wave2-drager-babylog-vn800",
    "wave2-ambu-vivasight-2-dlt",
  ]);
  const report = buildFirstPublicationCandidateReport(fixtureInput());
  assert.equal(report.candidates.length, 5);
  assert.equal(report.eligibleProducts, 0);
  assert.equal(report.automaticApprovalsCreated, 0);

  const unselected = fixtureInput();
  unselected.selectedProductSlugs = ["another-product"];
  const result = buildPublishedCatalog(unselected);
  assert.equal(result.catalog.kpi.publishedProducts, 0);
  assert.equal(result.catalog.blockedByReason.not_selected, 2);
});

test("integrity violations and verification conflicts block publication", () => {
  const integrity = buildPublishedCatalog(
    fixtureInput({ integrity: [{ productSlug: "test-medical-device" }] }),
  );
  assert.equal(integrity.catalog.kpi.publishedProducts, 0);
  assert.equal(integrity.catalog.blockedByReason.integrity_violation, 2);

  const input = fixtureInput();
  input.verificationConflictReviewItemIds = ["review-ready-1", "review-ready-compatibility"];
  const conflict = buildPublishedCatalog(input);
  assert.equal(conflict.catalog.blockedByReason.verification_conflict, 2);
});

test("public slugs are deterministic and normalize Cyrillic", () => {
  assert.equal(publicSlug("Тест Медикал"), "test-medikal");
  assert.equal(publicSlug("  GE HealthCare / LOGIQ E10  "), "ge-healthcare-logiq-e10");
});

test("builder is deterministic", () => {
  const first = buildPublishedCatalog(fixtureInput());
  const second = buildPublishedCatalog(fixtureInput());
  assert.deepEqual(first, second);
});

test("publisher is idempotent and audit validates the generated catalog", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-publication-"));
  try {
    await publishCatalog({ publicRoot: root, buildInput: fixtureInput() });
    const first = await readFile(join(root, "summary.generated.json"), "utf8");
    await publishCatalog({ publicRoot: root, buildInput: fixtureInput() });
    const second = await readFile(join(root, "summary.generated.json"), "utf8");
    assert.equal(second, first);
    const audit = await auditPublishedCatalog(
      root,
      buildPublishedCatalog(fixtureInput()).catalog,
    );
    assert.equal(audit.valid, true);
    assert.equal(audit.kpi.knowledgeEntries, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audit detects orphan publications and stale output", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-publication-audit-"));
  try {
    await publishCatalog({ publicRoot: root, buildInput: fixtureInput() });
    await writeFile(join(root, "products/orphan.json"), "{}\n", "utf8");
    const audit = await auditPublishedCatalog(root);
    assert.equal(audit.valid, false);
    assert.ok(audit.issues.some((issue) => issue.code === "orphan_publication"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validator rejects duplicate slugs, internal JSON links and absolute paths", () => {
  const catalog = buildPublishedCatalog(fixtureInput()).catalog;
  catalog.products.push({ ...catalog.products[0], id: "another-id" });
  catalog.products[0].documents[0].url = "/Users/test/data/research/private.json";
  const validation = validatePublishedCatalog(catalog);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.code === "duplicate_slug"));
  assert.ok(validation.issues.some((issue) => issue.code === "absolute_path"));
  assert.ok(validation.issues.some((issue) => issue.code === "internal_json_link"));
});

test("public schema validator rejects internal metadata and SHA hashes", () => {
  const catalog = buildPublishedCatalog(fixtureInput()).catalog;
  const product = catalog.products[0] as unknown as Record<string, unknown>;
  product.reviewItemId = "review-ready-1";
  (catalog.products[0].documents[0] as unknown as Record<string, unknown>).sha256 = "a".repeat(64);
  const validation = validatePublishedCatalog(catalog);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.code === "public_schema_violation"));
  assert.ok(validation.issues.some((issue) => issue.code === "internal_metadata_exposed"));
  assert.ok(validation.issues.some((issue) => issue.code === "sha_hash_exposed"));
});

test("current catalog uses draft fallback when no product is published", () => {
  const cards = getCatalogCardsWithFallback();
  assert.ok(cards.length > 0);
  assert.ok(cards.every((card) => card.displayStatus !== "published"));
});

test("catalog, product and manufacturers continue to read the Published Catalog", async () => {
  const [catalogPage, productPage, manufacturerPage, manufacturersPage, loader] = await Promise.all([
    readFile("app/catalog/page.tsx", "utf8"),
    readFile("app/catalog/[slug]/page.tsx", "utf8"),
    readFile("app/manufacturers/[slug]/page.tsx", "utf8"),
    readFile("app/manufacturers/page.tsx", "utf8"),
    readFile("lib/published-catalog.ts", "utf8"),
  ]);
  assert.match(catalogPage, /getCatalogCardsWithFallback/u);
  assert.match(productPage, /PublishedProductPage/u);
  assert.match(manufacturerPage, /getPublishedManufacturerProducts/u);
  assert.match(manufacturersPage, /getPublishedCatalog/u);
  assert.match(productPage, /officialSources|specifications|updatedAt/u);
  assert.doesNotMatch(productPage, /SHA-256:/u);
  assert.match(loader, /summary\.generated\.json/u);
  assert.match(loader, /getDraftCatalogProduct/u);
});

test("publication module does not import protected writers", async () => {
  const files = [
    "publisher.ts",
    "publication-builder.ts",
    "publication-validator.ts",
    "publication-summary.ts",
    "publication-candidates.ts",
    "types.ts",
    "index.ts",
  ];
  const source = (
    await Promise.all(
      files.map((file) =>
        readFile(join("scripts/importers/catalog/publication", file), "utf8"),
      ),
    )
  ).join("\n");
  assert.doesNotMatch(source, /supabase|verifiedClaims|publication history/iu);
  assert.doesNotMatch(source, /data\/research\/(?:wave2|documents|extraction|evidence)/u);
});
