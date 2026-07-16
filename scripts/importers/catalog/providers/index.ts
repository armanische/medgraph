import { AmbuProvider } from "./ambu.ts";
import { DefaultProvider } from "./default.ts";
import { DragerProvider } from "./drager.ts";
import { GEHealthcareProvider } from "./ge-healthcare.ts";
import { HamiltonProvider } from "./hamilton.ts";
import { MindrayProvider } from "./mindray.ts";
import { PhilipsProvider } from "./philips.ts";
import type { ManufacturerProvider } from "./types.ts";

export * from "./types.ts";
export { AmbuProvider } from "./ambu.ts";
export { DefaultProvider } from "./default.ts";
export { DragerProvider } from "./drager.ts";
export { GEHealthcareProvider } from "./ge-healthcare.ts";
export { HamiltonProvider } from "./hamilton.ts";
export { MindrayProvider } from "./mindray.ts";
export { PhilipsProvider } from "./philips.ts";

const PROVIDERS: ManufacturerProvider[] = [
  new HamiltonProvider(),
  new MindrayProvider(),
  new AmbuProvider(),
  new DragerProvider(),
  new PhilipsProvider(),
  new GEHealthcareProvider(),
];

export function providerForManufacturer(manufacturer: string | null) {
  return PROVIDERS.find((provider) => provider.matches(manufacturer)) ?? new DefaultProvider();
}

export function supportedManufacturerProviders() {
  return [...PROVIDERS];
}
