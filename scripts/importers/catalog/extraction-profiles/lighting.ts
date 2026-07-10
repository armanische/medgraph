import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class LightingExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "lighting" as const;
  readonly categoryMatchers = [/lighting|surgical light|светильник|освещ/iu];
  readonly expectedFields = ["illumination", "color_temperature", "diameter", "sterile_handle"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "illumination", category: "measurementRanges", label: "Освещённость", synonyms: ["Illumination"], pattern: /(?:illumination|illuminance|освещ[её]нность)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(lx|klx|lux)/giu, confidence: 0.82, unitGroup: 2 },
    { fieldKey: "color_temperature", category: "display", label: "Цветовая температура", synonyms: ["Color temperature"], pattern: /(?:color temperature|цветовая температура)\s*[:–-]?\s*([0-9]+)\s*(k)\b/giu, confidence: 0.8, unitGroup: 2 },
    { fieldKey: "diameter", category: "dimensions", label: "Диаметр светового поля", synonyms: ["Light field diameter"], pattern: /(?:light field diameter|diameter|диаметр)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|мм|cm|см)/giu, confidence: 0.76, unitGroup: 2 },
    { fieldKey: "sterile_handle", category: "safetyFeatures", label: "Стерильная рукоятка", synonyms: ["Sterile handle"], pattern: /\b(sterile handle|стерильн[^\n;]{0,40} рукоят[^\n;]{0,40})\b/giu, confidence: 0.72 },
  ];
}
