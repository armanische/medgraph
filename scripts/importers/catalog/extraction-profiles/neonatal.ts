import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class NeonatalExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "neonatal" as const;
  readonly categoryMatchers = [/neonatal|incubator|инкубатор|новорожден/iu];
  readonly expectedFields = ["temperature", "humidity", "weight_capacity", "oxygen", "alarms"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "temperature", category: "environment", label: "Температура", synonyms: ["Temperature"], pattern: /(?:temperature|температура)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(°c|c|℃)/giu, confidence: 0.78, unitGroup: 2 },
    { fieldKey: "humidity", category: "environment", label: "Влажность", synonyms: ["Humidity"], pattern: /(?:humidity|влажность)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(%|percent)/giu, confidence: 0.78, unitGroup: 2 },
    { fieldKey: "weight_capacity", category: "weight", label: "Масса пациента", synonyms: ["Patient weight", "Weight capacity"], pattern: /(?:patient weight|weight capacity|масса пациента)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(kg|кг|g|г)/giu, confidence: 0.78, unitGroup: 2 },
    { fieldKey: "oxygen", category: "measurementRanges", label: "Кислород", synonyms: ["Oxygen"], pattern: /(?:oxygen|кислород)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(%|percent)/giu, confidence: 0.76, unitGroup: 2 },
    { fieldKey: "alarms", category: "safetyFeatures", label: "Тревоги", synonyms: ["Alarms"], pattern: /(?:alarms|тревоги|сигнализация)\s*[:–-]\s*([^\n;]{2,180})/giu, confidence: 0.74 },
  ];
}
