import "server-only";

import { PRODUCTION_SUPABASE_PROJECT_REF } from "@/lib/supabase/env";

export interface InternalAuthEnvironment {
  url: string;
  anonKey: string;
}

export function getInternalAuthEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): InternalAuthEnvironment {
  const urlValue = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const projectRef = environment.CYBERMEDICA_SUPABASE_PROJECT_REF?.trim();
  if (!urlValue || !anonKey || !projectRef) {
    throw new Error("Internal Auth Supabase environment is incomplete.");
  }

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("Internal Auth Supabase URL is invalid.");
  }

  if (environment.VERCEL_ENV === "production") {
    if (
      projectRef !== PRODUCTION_SUPABASE_PROJECT_REF
      || url.origin !== `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      throw new Error("Internal Auth Production Supabase binding is invalid.");
    }
    return { url: url.origin, anonKey };
  }

  if (
    environment.NODE_ENV === "test"
    && projectRef === "localdevelopment0001"
    && (url.origin === "http://127.0.0.1:54321" || url.origin === "http://localhost:54321")
  ) {
    return { url: url.origin, anonKey };
  }

  throw new Error("Internal Auth Supabase environment is not approved.");
}
