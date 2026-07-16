import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class EndoscopyExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "endoscopy" as const;
  readonly categoryMatchers = [/endoscop|эндоскоп|broncho/iu];
  readonly expectedFields = ["working_channel", "diameter", "length", "sterile", "single_use"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "working_channel", category: "interfaces", label: "Рабочий канал", synonyms: ["Working channel"], pattern: /(?:working channel|рабочий канал)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|мм)/giu, confidence: 0.86, unitGroup: 2 },
    { fieldKey: "diameter", category: "dimensions", label: "Диаметр", synonyms: ["Diameter", "Outer diameter"], pattern: /(?:diameter|outer diameter|диаметр)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|мм)/giu, confidence: 0.84, unitGroup: 2 },
    { fieldKey: "length", category: "dimensions", label: "Длина", synonyms: ["Length", "Working length"], pattern: /(?:working length|length|длина)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|мм|cm|см)/giu, confidence: 0.84, unitGroup: 2 },
    { fieldKey: "sterile", category: "safetyFeatures", label: "Стерильность", synonyms: ["Sterile"], pattern: /\b(sterile|стерильн[^\n;]{0,80})\b/giu, confidence: 0.78 },
    { fieldKey: "single_use", category: "intendedUse", label: "Одноразовое применение", synonyms: ["Single-use", "Disposable"], pattern: /\b(single[-\s]?use|disposable|одноразов[^\n;]{0,80})\b/giu, confidence: 0.8 },
  ];
}
