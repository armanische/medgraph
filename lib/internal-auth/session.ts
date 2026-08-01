import "server-only";

import { redirect } from "next/navigation";

import { AUTH_ERROR_CODES, INTERNAL_LOGIN_PATH } from "./constants.ts";
import { isApprovedInternalAccess } from "./policy.ts";
import { createInternalAuthServerClient } from "./supabase.server.ts";

export async function readCurrentInternalAccess(
  supabase: Awaited<ReturnType<typeof createInternalAuthServerClient>>,
) {
  const { data, error } = await supabase
    .schema("cloud_api")
    .rpc("current_internal_access_v1");
  if (error) return null;
  return data;
}

export async function getTrustedReviewer() {
  const supabase = await createInternalAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const access = await readCurrentInternalAccess(supabase);
  if (!isApprovedInternalAccess(data.user, access)) return null;
  return data.user;
}

export async function requireTrustedReviewer() {
  const user = await getTrustedReviewer();
  if (!user) {
    redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.sessionRequired}`);
  }
  return user;
}
