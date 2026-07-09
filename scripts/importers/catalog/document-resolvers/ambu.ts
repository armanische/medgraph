import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class AmbuDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "ambu";
  readonly manufacturerMatchers = [/ambu/iu, /ambu\.com/iu];
  readonly sectionKeywords = ["Documents", "Downloads", "IFU", "Instructions", "Resources"];
  readonly linkKeywords = [
    "documents",
    "downloads",
    "ifu",
    "instructions for use",
    "manual",
    "quick guide",
    "brochure",
    "datasheet",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
