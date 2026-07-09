import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class DefaultDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "default";
  readonly manufacturerMatchers = [/.*/u];
  readonly sectionKeywords = [
    "documentation",
    "documents",
    "downloads",
    "resources",
    "support",
    "media",
    "library",
  ];
  readonly linkKeywords = [
    "pdf",
    "download",
    "resource",
    "document",
    "manual",
    "operator",
    "instructions",
    "ifu",
    "datasheet",
    "brochure",
    "technical",
    "catalogue",
    "support",
    "library",
    "media",
    "attachment",
  ];

  matches(source: SourceCandidate) {
    void source;
    return true;
  }
}
