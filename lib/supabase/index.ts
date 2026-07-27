import "server-only";

export {
  LOCAL_SUPABASE_ORIGIN_OPT_IN,
  LOCAL_SUPABASE_PROJECT_REF,
  PRODUCTION_SUPABASE_PROJECT_REF,
  PROJECT_BOUND_SUPABASE_REF_ENV,
  PROJECT_BOUND_SUPABASE_URL_ENV,
  STAGING_SUPABASE_PROJECT_REF,
  SupabaseEnvironmentError,
  getProjectBoundSupabaseServiceEnvironment,
  validateSupabaseProjectBinding,
  validateSupabaseProjectOrigin,
  type SupabaseProjectBoundServiceEnvironment,
  type SupabaseDeploymentEnvironment,
  type ValidateSupabaseProjectBindingOptions,
  type ValidateSupabaseProjectOriginOptions,
} from "./env.ts";
export {
  createProjectBoundSupabaseServerClient,
  createSupabaseServerClient,
  type CreateProjectBoundSupabaseServerClientOptions,
  SupabaseConnectionError,
  type CreateSupabaseServerClientOptions,
  type SupabaseServerAccess,
  type SupabaseServerClient,
} from "./client.server.ts";
export {
  checkSupabaseConnection,
  type SupabaseHealthResult,
} from "./health.ts";
