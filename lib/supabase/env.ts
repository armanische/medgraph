export class SupabaseEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseEnvironmentError";
  }
}

export interface SupabasePublicEnvironment {
  url: string;
  anonKey: string;
}

export interface SupabaseServiceEnvironment extends SupabasePublicEnvironment {
  serviceRoleKey: string;
}

function requireValue(
  environment: Readonly<Record<string, string | undefined>>,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value) throw new SupabaseEnvironmentError(`${name} is required.`);
  return value;
}

function validateUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SupabaseEnvironmentError("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new SupabaseEnvironmentError(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS, except for localhost development.",
    );
  }
  return url.toString().replace(/\/$/u, "");
}

export function getSupabasePublicEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): SupabasePublicEnvironment {
  return {
    url: validateUrl(requireValue(environment, "NEXT_PUBLIC_SUPABASE_URL")),
    anonKey: requireValue(environment, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): SupabaseServiceEnvironment {
  return {
    ...getSupabasePublicEnvironment(environment),
    serviceRoleKey: requireValue(environment, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}
