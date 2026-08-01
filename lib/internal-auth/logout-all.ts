import type { InternalAccessDecision } from "./policy.ts";
import { isApprovedInternalAccess } from "./policy.ts";
import {
  decodeInternalSessionClaims,
  isApprovedCorporateSessionClaims,
} from "./claims.ts";

interface LogoutSession {
  access_token: string;
  user: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
  };
}

export interface CorporateLogoutClient {
  auth: {
    getSession(): Promise<{
      data: { session: LogoutSession | null };
      error: unknown;
    }>;
    signOut(options: { scope: "global" }): Promise<{ error: unknown }>;
  };
  schema(name: "cloud_api"): {
    rpc(name: "current_internal_access_v1"): PromiseLike<{
      data: InternalAccessDecision | null;
      error: unknown;
    }>;
  };
}

export type CorporateLogoutResult =
  | { status: "signed_out_all" }
  | {
    status: "blocked";
    code: "session_required" | "corporate_identity_required" | "profile_required" | "logout_failed";
  };

export async function performCorporateGlobalLogout(
  client: CorporateLogoutClient,
): Promise<CorporateLogoutResult> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const session = sessionData.session;
  if (sessionError || !session?.access_token) {
    return { status: "blocked", code: "session_required" };
  }

  const claims = decodeInternalSessionClaims(session.access_token);
  if (
    !isApprovedCorporateSessionClaims(claims)
    || session.user.id !== claims?.sub
    || session.user.email !== claims.email
  ) {
    return { status: "blocked", code: "corporate_identity_required" };
  }

  const { data: access, error: accessError } = await client
    .schema("cloud_api")
    .rpc("current_internal_access_v1");
  if (accessError || !isApprovedInternalAccess(session.user, access)) {
    return { status: "blocked", code: "profile_required" };
  }

  const { error: logoutError } = await client.auth.signOut({ scope: "global" });
  if (logoutError) return { status: "blocked", code: "logout_failed" };
  return { status: "signed_out_all" };
}
