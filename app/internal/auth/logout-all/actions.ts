"use server";

import { redirect } from "next/navigation";

import { INTERNAL_LOGIN_PATH } from "@/lib/internal-auth/constants";
import { performCorporateGlobalLogout } from "@/lib/internal-auth/logout-all";
import {
  clearInternalAuthCookies,
  createInternalAuthServerClient,
} from "@/lib/internal-auth/supabase.server";

export async function logoutAllCorporateSessions() {
  const client = await createInternalAuthServerClient();
  const result = await performCorporateGlobalLogout(client);
  if (result.status === "signed_out_all") {
    await clearInternalAuthCookies();
    redirect(`${INTERNAL_LOGIN_PATH}?status=SIGNED_OUT_ALL`);
  }
  redirect(`${INTERNAL_LOGIN_PATH}?error=CORPORATE_LOGOUT_BLOCKED`);
}
