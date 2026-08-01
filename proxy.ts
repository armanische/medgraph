import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ERROR_CODES, INTERNAL_LOGIN_PATH } from "@/lib/internal-auth/constants";
import { resolveInternalAuthOrigin } from "@/lib/internal-auth/policy";
import { readActiveTrustedReviewer } from "@/lib/internal-auth/session";
import {
  applyInternalAuthCookies,
  createInternalAuthRouteClient,
} from "@/lib/internal-auth/supabase.server";

export async function proxy(request: NextRequest) {
  const { client, pendingCookies, pendingHeaders } =
    createInternalAuthRouteClient(request);
  const active = await readActiveTrustedReviewer(client);
  if (!active) {
    await client.auth.signOut({ scope: "local" });
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
  matcher: [
    "/internal/review/:path*",
    "/internal/operations/:path*",
  ],
};
