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

export interface SupabaseProjectBoundServiceEnvironment {
  url: string;
  projectRef: string;
  serviceRoleKey: string;
}

export const LOCAL_SUPABASE_ORIGIN_OPT_IN = "CYBERMEDICA_ALLOW_LOCAL_SUPABASE_ORIGIN";
export const PROJECT_BOUND_SUPABASE_URL_ENV = "CYBERMEDICA_SUPABASE_URL";
export const PROJECT_BOUND_SUPABASE_REF_ENV = "CYBERMEDICA_SUPABASE_PROJECT_REF";
export const STAGING_SUPABASE_PROJECT_REF = "gjlpkqdhlzbfnzzoxlsk";
export const PRODUCTION_SUPABASE_PROJECT_REF = "clbzibuusyuajsylcbvl";
export const LOCAL_SUPABASE_PROJECT_REF = "localdevelopment0001";

const supabaseProjectHostname = /^[a-z0-9]{20}\.supabase\.co$/u;
const supabaseProjectRef = /^[a-z0-9]{20}$/u;
const localSupabaseHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type SupabaseDeploymentEnvironment = "production" | "preview" | "local";

const approvedProjectRefByEnvironment: Readonly<
  Record<SupabaseDeploymentEnvironment, string>
> = Object.freeze({
  production: PRODUCTION_SUPABASE_PROJECT_REF,
  preview: STAGING_SUPABASE_PROJECT_REF,
  local: STAGING_SUPABASE_PROJECT_REF,
});

export interface ValidateSupabaseProjectOriginOptions {
  allowLocalDevelopment?: boolean;
}

export interface ValidateSupabaseProjectBindingOptions {
  deploymentEnvironment: SupabaseDeploymentEnvironment;
  allowLocalQa?: boolean;
}

function resolveSupabaseDeploymentEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): SupabaseDeploymentEnvironment {
  const vercelEnvironment = environment.VERCEL_ENV?.trim();
  if (vercelEnvironment === "production" || vercelEnvironment === "preview") {
    return vercelEnvironment;
  }
  if (vercelEnvironment === "development") return "local";
  if (vercelEnvironment !== undefined && vercelEnvironment !== "") {
    throw new SupabaseEnvironmentError("Supabase deployment environment is unsupported.");
  }

  if (environment.VERCEL === "1") {
    throw new SupabaseEnvironmentError("Supabase deployment environment is required.");
  }

  const nodeEnvironment = environment.NODE_ENV?.trim();
  if (nodeEnvironment === "development" || nodeEnvironment === "test") {
    return "local";
  }

  throw new SupabaseEnvironmentError("Supabase deployment environment is required.");
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

/**
 * Restricts service-role storefront traffic to a canonical Supabase project
 * origin. Loopback is available only through an explicit local-test opt-in.
 */
export function validateSupabaseProjectOrigin(
  value: string,
  options: ValidateSupabaseProjectOriginOptions = {},
): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SupabaseEnvironmentError(
      "NEXT_PUBLIC_SUPABASE_URL must be an approved Supabase project origin.",
    );
  }

  const hasUnexpectedParts = value !== value.trim()
    || value.includes("%")
    || url.username !== ""
    || url.password !== ""
    || url.pathname !== "/"
    || url.search !== ""
    || url.hash !== "";
  const approvedCloudOrigin = url.protocol === "https:"
    && url.port === ""
    && supabaseProjectHostname.test(url.hostname);
  const approvedLocalOrigin = options.allowLocalDevelopment === true
    && url.protocol === "http:"
    && localSupabaseHostnames.has(url.hostname);

  if (hasUnexpectedParts || (!approvedCloudOrigin && !approvedLocalOrigin)) {
    throw new SupabaseEnvironmentError(
      "NEXT_PUBLIC_SUPABASE_URL must be an approved Supabase project origin.",
    );
  }

  return url.origin;
}

/**
 * Binds a service credential target to one explicitly configured Supabase
 * project. The loopback exception exists only for isolated local QA and uses a
 * fixed non-cloud project identity.
 */
export function validateSupabaseProjectBinding(
  value: string,
  projectRefValue: string,
  options: ValidateSupabaseProjectBindingOptions,
): string {
  const projectRef = projectRefValue.trim();
  if (projectRefValue !== projectRef || !supabaseProjectRef.test(projectRef)) {
    throw new SupabaseEnvironmentError(
      `${PROJECT_BOUND_SUPABASE_REF_ENV} must be a canonical 20-character project ref.`,
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SupabaseEnvironmentError(
      `${PROJECT_BOUND_SUPABASE_URL_ENV} must match the approved Supabase project.`,
    );
  }

  const hasUnexpectedParts = value !== value.trim()
    || value.includes("%")
    || url.username !== ""
    || url.password !== ""
    || url.pathname !== "/"
    || url.search !== ""
    || url.hash !== "";
  const approvedProjectRef = approvedProjectRefByEnvironment[options.deploymentEnvironment];
  const approvedCloudOrigin = projectRef === approvedProjectRef
    && url.protocol === "https:"
    && url.port === ""
    && url.hostname === `${projectRef}.supabase.co`;
  const approvedLocalOrigin = options.deploymentEnvironment === "local"
    && options.allowLocalQa === true
    && projectRef === LOCAL_SUPABASE_PROJECT_REF
    && url.protocol === "http:"
    && localSupabaseHostnames.has(url.hostname);

  if (hasUnexpectedParts || (!approvedCloudOrigin && !approvedLocalOrigin)) {
    throw new SupabaseEnvironmentError(
      `${PROJECT_BOUND_SUPABASE_URL_ENV} must match the approved Supabase project.`,
    );
  }

  return url.origin;
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

export function getProjectBoundSupabaseServiceEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  options: { allowLocalDevelopment?: boolean } = {},
): SupabaseProjectBoundServiceEnvironment {
  const deploymentEnvironment = resolveSupabaseDeploymentEnvironment(environment);
  const projectRef = requireValue(environment, PROJECT_BOUND_SUPABASE_REF_ENV);
  return {
    url: validateSupabaseProjectBinding(
      requireValue(environment, PROJECT_BOUND_SUPABASE_URL_ENV),
      projectRef,
      {
        deploymentEnvironment,
        allowLocalQa: options.allowLocalDevelopment === true
          && deploymentEnvironment === "local"
          && environment.NODE_ENV === "test"
          && environment.VERCEL_ENV === undefined
          && environment.VERCEL !== "1",
      },
    ),
    projectRef,
    serviceRoleKey: requireValue(environment, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}
