import { BaseManufacturerProvider } from "./base-provider.ts";

export class PhilipsProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "philips",
      strategy: "Philips professional products, support and documentation",
      manufacturerMatchers: [/philips/iu],
      officialHosts: ["philips.com"],
      preferredSections: ["professional", "support", "documentation", "downloads"],
    });
  }
}
