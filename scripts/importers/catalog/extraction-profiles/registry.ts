import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class RegistryExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "registry" as const;
  readonly categoryMatchers = [/.*/u];
  readonly expectedFields = ["manufacturer", "model", "registration_number"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "manufacturer", category: "manufacturer", label: "Производитель", synonyms: ["Manufacturer", "производитель"], pattern: /(?:manufacturer|производитель)\s*[:–-]\s*([^\n;]{2,160})/giu, confidence: 0.86 },
    { fieldKey: "model", category: "model", label: "Модель", synonyms: ["Model", "модель"], pattern: /(?:model|модель)\s*[:–-]\s*([^\n;]{1,100})/giu, confidence: 0.86 },
    { fieldKey: "registration_number", category: "registrationNumber", label: "Регистрационный номер", synonyms: ["Registration Number", "Registration No", "РУ"], pattern: /(?:registration (?:number|no\.?)|регистрационн(?:ый|ого) номер|РУ)\s*[:№–-]\s*([^\n;]{3,100})/giu, confidence: 0.9 },
  ];
}
