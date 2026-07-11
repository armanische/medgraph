import { BaseManufacturerProvider } from "./base-provider.ts";

export class HamiltonProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "hamilton",
      strategy: "Hamilton product pages and documentation/download sections",
      manufacturerMatchers: [/hamilton(?:\s+medical)?/iu],
      officialHosts: ["hamilton-medical.com"],
      preferredSections: ["documentation", "technical_documentation", "downloads"],
    });
  }
}
