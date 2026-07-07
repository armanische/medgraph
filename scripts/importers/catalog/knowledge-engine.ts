import { createHash } from "node:crypto";

import type {
  CandidateCharacteristic,
  CatalogSeedItem,
  CharacteristicCategory,
  ConflictDetector,
  DocumentCandidate,
  DocumentFinder,
  EvidenceBuilder,
  ManufacturerCandidate,
  ManufacturerResolution,
  ManufacturerResolver,
  MissingInformationDetector,
  ResearchConflict,
  ResearchDiscovery,
  ResearchProvider,
  SourceCandidate,
  SourceFinder,
} from "./types.ts";

const MANUFACTURER_RULES: Array<{
  pattern: RegExp;
  candidate: Omit<ManufacturerCandidate, "reason" | "status">;
}> = [
  {
    pattern: /\bHamilton\b|\bC1\b|\bT1\b/i,
    candidate: {
      name: "Hamilton Medical",
      officialHosts: ["hamilton-medical.com"],
      confidence: 0.95,
    },
  },
  {
    pattern: /\bAmbu\b|\baScope\b/i,
    candidate: {
      name: "Ambu",
      officialHosts: ["ambu.com"],
      confidence: 0.95,
    },
  },
  {
    pattern: /\bMindray\b|\bSV\d+\b|\bWATO\b|\bBeneVision\b/i,
    candidate: {
      name: "Mindray",
      officialHosts: ["mindray.com"],
      confidence: 0.94,
    },
  },
  {
    pattern: /\bSLE\s*6000\b/i,
    candidate: {
      name: "SLE",
      officialHosts: ["sle.co.uk"],
      confidence: 0.94,
    },
  },
  {
    pattern: /\bSonoScape\b/i,
    candidate: {
      name: "SonoScape",
      officialHosts: ["sonoscape.com"],
      confidence: 0.94,
    },
  },
  {
    pattern: /\bPentax\b/i,
    candidate: {
      name: "Pentax Medical",
      officialHosts: ["pentaxmedical.com"],
      confidence: 0.94,
    },
  },
];

export class DefaultManufacturerResolver implements ManufacturerResolver {
  resolve(product: CatalogSeedItem, sources: SourceCandidate[]) {
    const searchable = [
      product.normalizedTitle,
      product.modelCandidate,
      ...sources.flatMap((source) => [
        source.detectedManufacturer,
        source.publisher,
        source.sourceTitle,
      ]),
    ]
      .filter(Boolean)
      .join(" ");
    const candidates = MANUFACTURER_RULES.filter(({ pattern }) =>
      pattern.test(searchable),
    ).map(({ candidate }) => ({
      ...candidate,
      reason:
        "Manufacturer candidate matched product/model tokens; official source confirmation is still required.",
      status: "candidate" as const,
    }));
    const unique = [
      ...new Map(candidates.map((candidate) => [candidate.name, candidate])).values(),
    ];
    return {
      candidates: unique,
      selected: unique.length === 1 ? unique[0] : null,
      ambiguous: unique.length > 1,
      warnings:
        unique.length > 1
          ? ["Multiple manufacturer candidates were found; none was selected."]
          : unique.length === 0
            ? ["Manufacturer could not be resolved."]
            : [],
    } satisfies ManufacturerResolution;
  }
}

export class ProviderSourceFinder implements SourceFinder {
  private readonly provider: ResearchProvider;

  constructor(provider: ResearchProvider) {
    this.provider = provider;
  }

  async find(
    product: CatalogSeedItem,
    manufacturer: ManufacturerResolution,
  ): Promise<ResearchDiscovery> {
    return this.provider.discover({
      ...product,
      brandCandidate:
        manufacturer.selected?.name ?? product.brandCandidate,
    });
  }
}

export class DefaultDocumentFinder implements DocumentFinder {
  find(discovery: ResearchDiscovery) {
    return [
      ...new Map(
        discovery.documents.map((document) => [document.url, document]),
      ).values(),
    ];
  }
}

function stableId(prefix: string, parts: string[]) {
  return `${prefix}_${createHash("sha256")
    .update(parts.join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

export class DefaultEvidenceBuilder implements EvidenceBuilder {
  build(characteristic: CandidateCharacteristic) {
    const evidenceCandidateId = stableId("evidence", [
      characteristic.sourceUrl,
      characteristic.rawText,
    ]);
    return {
      evidenceCandidateId,
      kind:
        characteristic.extractionMethod === "html_metadata"
          ? ("html_metadata" as const)
          : ("document_excerpt" as const),
      sourceUrl: characteristic.sourceUrl,
      sourceTitle: characteristic.sourceTitle,
      documentKey: characteristic.documentKey,
      documentVersionId: characteristic.documentVersion,
      documentTitle: characteristic.documentTitle,
      documentType: characteristic.documentType,
      locator: characteristic.locator,
      quotedText: characteristic.rawText,
      rawText: characteristic.rawText,
      sha256: characteristic.documentSha256,
      documentVersion: characteristic.documentVersion,
      confidence: characteristic.confidence,
      status: "candidate" as const,
    };
  }
}

export class DefaultConflictDetector implements ConflictDetector {
  detect(
    product: CatalogSeedItem,
    characteristics: CandidateCharacteristic[],
  ) {
    const groups = new Map<string, CandidateCharacteristic[]>();
    for (const characteristic of characteristics) {
      const values = groups.get(characteristic.category) ?? [];
      values.push(characteristic);
      groups.set(characteristic.category, values);
    }
    const conflicts: ResearchConflict[] = [];
    for (const [category, values] of groups) {
      const distinct = new Map(
        values.map((value) => [
          `${value.value} ${value.unit ?? ""}`.trim().toLocaleLowerCase(),
          value,
        ]),
      );
      if (distinct.size < 2) continue;
      conflicts.push({
        conflictId: stableId("conflict", [
          product.slug,
          category,
          ...distinct.keys(),
        ]),
        field: category,
        characteristic: category,
        values: [...distinct.values()].map((value) => ({
          value: value.value,
          unit: value.unit,
          sourceUrl: value.sourceUrl,
          sourceTitle: value.sourceTitle,
        })),
        status: "needs_review",
        resolution: null,
      });
    }
    return conflicts;
  }
}

const EXPECTED_CHARACTERISTICS: CharacteristicCategory[] = [
  "manufacturer",
  "model",
  "deviceType",
  "intendedUse",
  "registrationNumber",
  "dimensions",
  "weight",
  "display",
  "battery",
  "power",
  "operatingModes",
  "measurementRanges",
  "accuracy",
  "interfaces",
  "compatibility",
  "consumables",
  "accessories",
  "safetyFeatures",
  "warnings",
  "contraindications",
  "environment",
  "storage",
  "maintenance",
  "serviceInterval",
  "softwareVersion",
  "warrantyService",
];

export class DefaultMissingInformationDetector
  implements MissingInformationDetector
{
  detect(characteristics: CandidateCharacteristic[]) {
    const present = new Set(
      characteristics.map((characteristic) => characteristic.category),
    );
    return EXPECTED_CHARACTERISTICS.filter((value) => !present.has(value));
  }
}

export function artifactCount(documents: DocumentCandidate[]) {
  return new Set(
    documents
      .map((document) => document.sha256)
      .filter((value): value is string => Boolean(value)),
  ).size;
}
