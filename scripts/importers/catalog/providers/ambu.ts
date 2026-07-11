import { BaseManufacturerProvider } from "./base-provider.ts";

export class AmbuProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "ambu",
      strategy: "Ambu products, IFU documentation and downloads",
      manufacturerMatchers: [/ambu/iu],
      officialHosts: ["ambu.com"],
      preferredSections: ["documentation", "downloads", "resources"],
    });
  }
}
