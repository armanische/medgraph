import "server-only";

import { redirect } from "next/navigation";

import { AUTH_ERROR_CODES, INTERNAL_LOGIN_PATH } from "./constants.ts";
import { isApprovedReviewer } from "./policy.ts";
import { createInternalAuthServerClient } from "./supabase.server.ts";

export async function getTrustedReviewer() {
  const supabase = await createInternalAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isApprovedReviewer(data.user)) return null;
  return data.user;
}

export async function requireTrustedReviewer() {
  const user = await getTrustedReviewer();
  if (!user) {
    redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.sessionRequired}`);
  }
  return user;
}
