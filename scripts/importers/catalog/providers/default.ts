import { BaseManufacturerProvider } from "./base-provider.ts";

export class DefaultProvider extends BaseManufacturerProvider {
  constructor(officialHosts: string[] = []) {
    super({
      name: "default",
      strategy: "Conservative official products and common document sections",
      manufacturerMatchers: [/.*/u],
      officialHosts,
      preferredSections: [
        "downloads",
        "resources",
        "support",
        "documentation",
        "library",
        "media",
        "professional",
        "technical_documentation",
      ],
    });
  }
}
