import { BaseManufacturerProvider } from "./base-provider.ts";

export class GEHealthcareProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "ge-healthcare",
      strategy: "GE HealthCare products, support, resources and document library",
      manufacturerMatchers: [/ge\s*healthcare/iu, /general\s+electric\s+healthcare/iu],
      officialHosts: ["gehealthcare.com"],
      preferredSections: ["support", "resources", "library", "downloads"],
    });
  }
}
