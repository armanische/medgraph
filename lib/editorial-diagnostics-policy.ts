/**
 * Publication Policy v2 covers editorial completeness only. It deliberately
 * does not model structural catalog invariants or publication state.
 */
export const EDITORIAL_WARNING_CODES = [
  "missing_registration",
  "missing_documents",
  "missing_manual",
  "missing_brochure",
  "missing_datasheet",
] as const;

export type EditorialWarningCode = (typeof EDITORIAL_WARNING_CODES)[number];

const editorialWarningCodeSet = new Set<string>(EDITORIAL_WARNING_CODES);

export function isEditorialWarningCode(code: string): code is EditorialWarningCode {
  return editorialWarningCodeSet.has(code);
}

/**
 * Separates editorial warnings from diagnostics governed by structural or
 * publication contracts. Callers must not use this result to bypass those
 * contracts.
 */
export function partitionEditorialDiagnostics(codes: readonly string[]) {
  const warnings: EditorialWarningCode[] = [];
  const otherDiagnostics: string[] = [];

  for (const code of codes) {
    if (isEditorialWarningCode(code)) {
      warnings.push(code);
    } else {
      otherDiagnostics.push(code);
    }
  }

  return { warnings, otherDiagnostics };
}
