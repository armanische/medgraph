import "server-only";

import {
  getSupabasePublicEnvironment,
  getSupabaseServiceEnvironment,
  type SupabasePublicEnvironment,
} from "./env.ts";

export type SupabaseServerAccess = "anon" | "service_role";

export class SupabaseConnectionError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SupabaseConnectionError";
    this.status = status;
  }
}

export interface SupabaseServerClient {
  readonly access: SupabaseServerAccess;
  readonly url: string;
  request(pathname: string, init?: RequestInit): Promise<Response>;
}

export interface CreateSupabaseServerClientOptions {
  access?: SupabaseServerAccess;
  environment?: Readonly<Record<string, string | undefined>>;
  fetchImplementation?: typeof fetch;
}

function resolveCredentials(
  access: SupabaseServerAccess,
  environment: Readonly<Record<string, string | undefined>>,
): SupabasePublicEnvironment & { key: string } {
  if (access === "service_role") {
    const values = getSupabaseServiceEnvironment(environment);
    return { url: values.url, anonKey: values.anonKey, key: values.serviceRoleKey };
  }
  const values = getSupabasePublicEnvironment(environment);
  return { ...values, key: values.anonKey };
}

export function createSupabaseServerClient(
  options: CreateSupabaseServerClientOptions = {},
): SupabaseServerClient {
  const access = options.access ?? "anon";
  const credentials = resolveCredentials(access, options.environment ?? process.env);
  const fetchImplementation = options.fetchImplementation ?? fetch;

  return {
    access,
    url: credentials.url,
    async request(pathname, init = {}) {
      const response = await fetchImplementation(new URL(pathname, `${credentials.url}/`), {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          apikey: credentials.key,
          Authorization: `Bearer ${credentials.key}`,
          ...init.headers,
        },
      });
      if (!response.ok) {
        throw new SupabaseConnectionError(
          `Supabase request failed with HTTP ${response.status}.`,
          response.status,
        );
      }
      return response;
    },
  };
}
