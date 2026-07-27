import "server-only";

import {
  getProjectBoundSupabaseServiceEnvironment,
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

export interface CreateProjectBoundSupabaseServerClientOptions {
  allowLocalDevelopment?: boolean;
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

  return createClient(access, credentials.url, credentials.key, fetchImplementation);
}

export function createProjectBoundSupabaseServerClient(
  options: CreateProjectBoundSupabaseServerClientOptions = {},
): SupabaseServerClient {
  const credentials = getProjectBoundSupabaseServiceEnvironment(
    options.environment ?? process.env,
    { allowLocalDevelopment: options.allowLocalDevelopment },
  );
  return createClient(
    "service_role",
    credentials.url,
    credentials.serviceRoleKey,
    options.fetchImplementation ?? fetch,
  );
}

function createClient(
  access: SupabaseServerAccess,
  url: string,
  key: string,
  fetchImplementation: typeof fetch,
): SupabaseServerClient {
  return {
    access,
    url,
    async request(pathname, init = {}) {
      const requestUrl = new URL(pathname, `${url}/`);
      if (requestUrl.origin !== new URL(url).origin) {
        throw new SupabaseConnectionError(
          "Supabase request target must use the configured origin.",
        );
      }
      const response = await fetchImplementation(requestUrl, {
        ...init,
        cache: "no-store",
        redirect: "error",
        headers: {
          Accept: "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
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
