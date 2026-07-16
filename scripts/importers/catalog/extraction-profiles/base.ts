import { createHash } from "node:crypto";

import type {
  CandidateCharacteristic,
  CharacteristicCategory,
  CharacteristicExtractionInput,
  EvidenceLocator,
} from "../types.ts";

export type ExtractionProfileName =
  | "registry"
  | "ventilator"
  | "ultrasound"
  | "anesthesia"
  | "patient-monitor"
  | "endoscopy"
  | "consumables"
  | "lighting"
  | "neonatal";

export interface CategoryExtractionRule {
  fieldKey: string;
  category: CharacteristicCategory;
  label: string;
  synonyms: string[];
  pattern: RegExp;
  confidence: number;
  valueGroup?: number;
  unitGroup?: number;
}

export interface ExtractionProfileCoverage {
  profile: ExtractionProfileName;
  expectedFields: string[];
  matchedFields: string[];
  failedFields: string[];
  coveragePercent: number;
  patternsMatched: Record<string, number>;
  normalizedUnits: Record<string, number>;
}

export interface CategoryExtractionProfile {
  readonly name: ExtractionProfileName;
  readonly categoryMatchers: RegExp[];
  readonly expectedFields: string[];
  readonly rules: CategoryExtractionRule[];
  matchesCategory(category: string): boolean;
  extract(input: CharacteristicExtractionInput): CandidateCharacteristic[];
  coverage(characteristics: CandidateCharacteristic[]): ExtractionProfileCoverage;
}

const UNIT_MAP: Array<[RegExp, string]> = [
  [/^(kg|кг)$/iu, "kg"],
  [/^(g|гр?|г)$/iu, "g"],
  [/^(inch|inches|in|")$/iu, "inch"],
  [/^(hours?|hrs?|h|ч|час(?:а|ов)?)$/iu, "h"],
  [/^(min|mins|minutes?|мин)$/iu, "min"],
  [/^(ml|мл)$/iu, "ml"],
  [/^(mm|мм)$/iu, "mm"],
  [/^(cm|см)$/iu, "cm"],
  [/^(µm|um|мкм)$/iu, "µm"],
  [/^(%|percent|процент(?:а|ов)?)$/iu, "%"],
];

export function normalizeUnit(unit: string | null | undefined) {
  if (!unit) return null;
  const cleaned = unit.trim();
  for (const [pattern, normalized] of UNIT_MAP) {
    if (pattern.test(cleaned)) return normalized;
  }
  return cleaned || null;
}

export function cleanExtractedValue(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/[.,;:]$/u, "");
}

export function locatorFor(text: string, index: number): EvidenceLocator {
  const preceding = text.slice(0, index);
  return {
    page: preceding.split("\f").length,
    section: null,
    heading: null,
    table: null,
    paragraph: preceding.split(/\n\s*\n|\n/u).length,
  };
}

export function catalogResearchDocumentKey(url: string) {
  return `catalog-research:${createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32)}`;
}

function synonymFor(rule: CategoryExtractionRule, rawText: string) {
  const normalizedRaw = rawText.toLocaleLowerCase("ru-RU");
  return (
    [...rule.synonyms]
      .sort((left, right) => right.length - left.length)
      .find((synonym) =>
        normalizedRaw.includes(synonym.toLocaleLowerCase("ru-RU")),
      ) ??
    rule.synonyms[0] ??
    rule.fieldKey
  );
}

export abstract class BaseCategoryExtractionProfile
  implements CategoryExtractionProfile
{
  abstract readonly name: ExtractionProfileName;
  abstract readonly categoryMatchers: RegExp[];
  abstract readonly expectedFields: string[];
  abstract readonly rules: CategoryExtractionRule[];

  matchesCategory(category: string) {
    return this.categoryMatchers.some((matcher) => matcher.test(category));
  }

  extract(input: CharacteristicExtractionInput) {
    const output: CandidateCharacteristic[] = [];
    const seen = new Set<string>();
    for (const rule of this.rules) {
      rule.pattern.lastIndex = 0;
      for (const match of input.text.matchAll(rule.pattern)) {
        const value = cleanExtractedValue(match[rule.valueGroup ?? 1] ?? "");
        if (!value) continue;
        const unit = normalizeUnit(
          rule.unitGroup ? cleanExtractedValue(match[rule.unitGroup] ?? "") : null,
        );
        const key = `${this.name}:${rule.fieldKey}:${value}:${unit ?? ""}`.toLocaleLowerCase(
          "ru-RU",
        );
        if (seen.has(key)) continue;
        seen.add(key);
        const rawText = cleanExtractedValue(match[0] ?? value);
        output.push({
          category: rule.category,
          label: rule.label,
          value,
          unit,
          rawText,
          sourceUrl: input.source.sourceUrl,
          sourceTitle: input.source.sourceTitle,
          documentKey: input.document
            ? catalogResearchDocumentKey(input.document.url)
            : null,
          documentTitle: input.document?.title ?? null,
          documentType: input.document?.documentType ?? null,
          documentSha256: input.document?.sha256 ?? null,
          documentVersion: input.document?.sha256
            ? `${catalogResearchDocumentKey(input.document.url)}:${input.document.sha256}`
            : null,
          locator: locatorFor(input.text, match.index ?? 0),
          extractionMethod: input.extractionMethod,
          confidence: rule.confidence,
          extractionProfile: this.name,
          matchedPattern: rule.fieldKey,
          matchedSynonym: synonymFor(rule, rawText),
          normalizedUnit: unit,
          status: "unverified",
          needsReview: true,
        });
      }
    }
    return output;
  }

  coverage(characteristics: CandidateCharacteristic[]): ExtractionProfileCoverage {
    const scoped = characteristics.filter(
      (characteristic) => characteristic.extractionProfile === this.name,
    );
    const matchedFields = [
      ...new Set(scoped.flatMap((item) => item.matchedPattern ?? [])),
    ].sort();
    const failedFields = this.expectedFields
      .filter((field) => !matchedFields.includes(field))
      .sort();
    const patternsMatched: Record<string, number> = {};
    const normalizedUnits: Record<string, number> = {};
    for (const item of scoped) {
      if (item.matchedPattern) {
        patternsMatched[item.matchedPattern] =
          (patternsMatched[item.matchedPattern] ?? 0) + 1;
      }
      if (item.normalizedUnit) {
        normalizedUnits[item.normalizedUnit] =
          (normalizedUnits[item.normalizedUnit] ?? 0) + 1;
      }
    }
    return {
      profile: this.name,
      expectedFields: this.expectedFields,
      matchedFields,
      failedFields,
      coveragePercent: this.expectedFields.length
        ? Math.round((matchedFields.length / this.expectedFields.length) * 100)
        : 100,
      patternsMatched,
      normalizedUnits,
    };
  }
}
