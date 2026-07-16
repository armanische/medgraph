import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class PatientMonitorExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "patient-monitor" as const;
  readonly categoryMatchers = [/patient monitor|monitoring|монитор пациент/iu];
  readonly expectedFields = ["parameters", "screen", "modules", "battery_runtime"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "parameters", category: "measurementRanges", label: "Параметры мониторинга", synonyms: ["Parameters", "Measured parameters"], pattern: /(?:parameters|measured parameters|параметры)\s*[:–-]\s*([^\n;]{2,200})/giu, confidence: 0.82 },
    { fieldKey: "screen", category: "display", label: "Экран", synonyms: ["Screen", "Display"], pattern: /(?:screen|display|экран|дисплей)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(inch|inches|in|")/giu, confidence: 0.86, unitGroup: 2 },
    { fieldKey: "modules", category: "accessories", label: "Модули", synonyms: ["Modules", "Parameter modules"], pattern: /(?:modules?|parameter modules?|модули)\s*[:–-]\s*([^\n;]{2,180})/giu, confidence: 0.78 },
    { fieldKey: "battery_runtime", category: "battery", label: "Время автономной работы", synonyms: ["Battery Runtime", "Battery Duration"], pattern: /(?:battery runtime|battery duration|battery life)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(hours?|hrs?|h|min|мин)/giu, confidence: 0.84, unitGroup: 2 },
  ];
}
