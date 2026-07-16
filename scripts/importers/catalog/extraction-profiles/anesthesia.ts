import { BaseCategoryExtractionProfile } from "./base.ts";
import { VentilatorExtractionProfile } from "./ventilator.ts";

const ventilator = new VentilatorExtractionProfile();

export class AnesthesiaExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "anesthesia" as const;
  readonly categoryMatchers = [/anesthesia|anaesthesia|наркоз|анестези/iu];
  readonly expectedFields = ventilator.expectedFields;
  readonly rules = ventilator.rules;
}
