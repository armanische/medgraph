import { createHash } from "node:crypto";

import { DefaultEvidenceBuilder } from "./knowledge-engine.ts";
import type {
  CandidateCharacteristic,
  CandidateClaim,
  CandidateClaimBuilder,
  CatalogSeedItem,
  EvidenceBuilder,
} from "./types.ts";

const CLAIM_TYPES: Record<CandidateCharacteristic["category"], string> = {
  manufacturer: "product.manufacturer",
  model: "product.model",
  deviceType: "product.device_type",
  country: "product.country",
  registrationNumber: "product.registration_number",
  dimensions: "product.dimensions",
  weight: "product.weight",
  display: "product.display_size",
  power: "product.power",
  battery: "product.battery_life",
  operatingModes: "product.operating_modes",
  measurementRanges: "product.measurement_ranges",
  accuracy: "product.accuracy",
  interfaces: "product.interfaces",
  compatibility: "product.compatibility",
  consumables: "product.consumables",
  accessories: "product.accessories",
  safetyFeatures: "product.safety_features",
  warnings: "product.warnings",
  contraindications: "product.contraindications",
  intendedUse: "product.intended_use",
  patientGroup: "product.patient_group",
  environment: "product.environment",
  storage: "product.storage",
  maintenance: "product.maintenance",
  serviceInterval: "product.service_interval",
  softwareVersion: "product.software_version",
  warrantyService: "product.warranty_service",
};

function stableId(prefix: string, values: string[]) {
  return `${prefix}_${createHash("sha256")
    .update(values.join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

export function validateCandidateClaim(value: CandidateClaim) {
  if (value.evidenceCandidateIds.length === 0) {
    throw new Error("Candidate Claim requires at least one Evidence candidate.");
  }
  if (value.autoPublish !== false || value.verificationStatus !== "unverified") {
    throw new Error("Candidate Claims cannot be verified or auto-published.");
  }
  return value;
}

export class DefaultCandidateClaimBuilder implements CandidateClaimBuilder {
  private readonly evidenceBuilder: EvidenceBuilder;

  constructor(evidenceBuilder?: EvidenceBuilder) {
    this.evidenceBuilder = evidenceBuilder ?? new DefaultEvidenceBuilder();
  }

  build(product: CatalogSeedItem, characteristics: CandidateCharacteristic[]) {
    return characteristics.map((characteristic) => {
      const claimTypeCandidate =
        CLAIM_TYPES[characteristic.category] ?? "unknown";
      const evidence = this.evidenceBuilder.build(characteristic);
      return validateCandidateClaim({
        claimId: stableId("claim", [
          product.slug,
          claimTypeCandidate,
          characteristic.value,
          characteristic.sourceUrl,
        ]),
        productSlug: product.slug,
        subjectType: "product",
        suggestedClaimType: claimTypeCandidate,
        claimTypeCandidate,
        valuePayload: {
          value: characteristic.value,
          unit: characteristic.unit,
        },
        scopePayload: {},
        rawText: characteristic.rawText,
        evidenceCandidateIds: [evidence.evidenceCandidateId],
        confidence: characteristic.confidence,
        extractionMethod: characteristic.extractionMethod,
        status: "candidate",
        verificationStatus: "unverified",
        autoPublish: false,
        needsReview: true,
        warnings: ["Требуется проверка человеком до создания Claim Revision."],
      });
    });
  }
}
