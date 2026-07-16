import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class ConsumablesExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "consumables" as const;
  readonly categoryMatchers = [/consumable|расход|filter|circuit|tube|scope|fs510/iu];
  readonly expectedFields = [
    "sterile",
    "usage",
    "connector",
    "dead_space",
    "humidification",
    "filtration_efficiency",
  ];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "sterile", category: "safetyFeatures", label: "Стерильность", synonyms: ["Sterile"], pattern: /\b(sterile|стерильн[^\n;]{0,80})\b/giu, confidence: 0.78 },
    { fieldKey: "usage", category: "intendedUse", label: "Применение", synonyms: ["Usage", "Use"], pattern: /(?:usage|intended use|use|применение|назначение)\s*[:–-]\s*([^\n;]{2,180})/giu, confidence: 0.78 },
    { fieldKey: "connector", category: "interfaces", label: "Коннектор", synonyms: ["Connector", "Connection"], pattern: /(?:connector|connection|коннектор|соединение)\s*[:–-]\s*([^\n;]{2,120})/giu, confidence: 0.76 },
    { fieldKey: "dead_space", category: "measurementRanges", label: "Мёртвое пространство", synonyms: ["Dead space"], pattern: /(?:dead space|м[её]ртвое пространство)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(ml|мл)/giu, confidence: 0.84, unitGroup: 2 },
    { fieldKey: "humidification", category: "compatibility", label: "Увлажнение", synonyms: ["Humidification"], pattern: /\b(humidification|humidifier|увлажнен[^\n;]{0,80})\b/giu, confidence: 0.72 },
    { fieldKey: "filtration_efficiency", category: "accuracy", label: "Эффективность фильтрации", synonyms: ["Filtration efficiency"], pattern: /(?:filtration efficiency|эффективность фильтрации)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(%|percent)/giu, confidence: 0.86, unitGroup: 2 },
  ];
}
