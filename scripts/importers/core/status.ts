import type { ImportStatus } from "./contracts.ts";

export function determineImportStatus(input: {
  registryRecordFound: boolean;
  normalizedRecordCreated: boolean;
  downloadedDocumentCount: number;
  documentOutcomeWarningCount: number;
  manifestWritten: boolean;
}): ImportStatus {
  if (!input.registryRecordFound) return "not-found";
  if (!input.normalizedRecordCreated) return "partial";
  if (
    input.downloadedDocumentCount === 0 &&
    input.documentOutcomeWarningCount === 0
  ) {
    return "partial";
  }
  if (!input.manifestWritten) return "partial";
  return "completed";
}
