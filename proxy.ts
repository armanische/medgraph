import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ERROR_CODES, INTERNAL_LOGIN_PATH } from "@/lib/internal-auth/constants";
import { isApprovedReviewer, resolveInternalAuthOrigin } from "@/lib/internal-auth/policy";
import {
  applyInternalAuthCookies,
  createInternalAuthRouteClient,
} from "@/lib/internal-auth/supabase.server";

export async function proxy(request: NextRequest) {
  const { client, pendingCookies, pendingHeaders } =
    createInternalAuthRouteClient(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !isApprovedReviewer(data.user)) {
    if (data.user) await client.auth.signOut({ scope: "local" });
    const login = new URL(INTERNAL_LOGIN_PATH, resolveInternalAuthOrigin());
    login.searchParams.set("error", AUTH_ERROR_CODES.sessionRequired);
    return applyInternalAuthCookies(
      NextResponse.redirect(login, 303),
      pendingCookies,
      pendingHeaders,
    );
  }

  return applyInternalAuthCookies(
    NextResponse.next({ request }),
    pendingCookies,
    pendingHeaders,
  );
}

export const config = {
  matcher: ["/internal/review/hamilton-t1"],
};
