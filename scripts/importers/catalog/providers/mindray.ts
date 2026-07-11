import { BaseManufacturerProvider } from "./base-provider.ts";

export class MindrayProvider extends BaseManufacturerProvider {
  constructor() {
    super({
      name: "mindray",
      strategy: "Mindray products, resources, support and downloads",
      manufacturerMatchers: [/mindray/iu],
      officialHosts: ["mindray.com"],
      preferredSections: ["resources", "support", "downloads"],
    });
  }
}
