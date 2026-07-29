import { PRODUCTION_SUPABASE_PROJECT_REF } from "../supabase/env.ts";

const productionSupabaseOrigin =
  `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;

function isExactOrigin(value: string | undefined, expected: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === expected
      && url.pathname === "/"
      && url.search === ""
      && url.hash === "";
  } catch {
    return false;
  }
}

/**
 * Indexing is enabled only for the Vercel Production deployment that is
 * bound to the approved Production cloud catalog. Preview, local and any
 * mismatched project binding remain fail-closed without changing ENV values.
 */
export function isProductionIndexingEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return environment.VERCEL_ENV === "production"
    && environment.CATALOG_DATA_SOURCE === "cloud_published"
    && environment.CYBERMEDICA_SUPABASE_PROJECT_REF === PRODUCTION_SUPABASE_PROJECT_REF
    && isExactOrigin(environment.CYBERMEDICA_SUPABASE_URL, productionSupabaseOrigin)
    && isExactOrigin(environment.NEXT_PUBLIC_SUPABASE_URL, productionSupabaseOrigin);
}
