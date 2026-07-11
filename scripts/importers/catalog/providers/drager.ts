import { BaseManufacturerProvider } from "./base-provider.ts";

export class DragerProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "drager",
      strategy: "Dräger products, media and technical documentation services",
      manufacturerMatchers: [/dr[äa]ger/iu, /draeger/iu],
      officialHosts: ["draeger.com", "drager.com"],
      preferredSections: ["media", "documentation", "technical_documentation", "downloads"],
    });
  }
}
