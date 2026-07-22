/**
 * Compatibility exports for callers that previously imported this module.
 *
 * The independent core implementation is in core-pipeline.ts. Filesystem
 * reference loading is an external adapter and is not used by the core.
 */
export { runLegacyImportPipeline } from "./core-pipeline.ts";
export { loadReferenceData } from "./adapters/reference-file-adapter.ts";
