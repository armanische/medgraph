import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_ERROR_CODES,
  INTERNAL_LOGIN_PATH,
} from "@/lib/internal-auth/constants";
import {
  isApprovedReviewer,
  callbackDestination,
  isSafeCallbackRequest,
  resolveInternalAuthOrigin,
} from "@/lib/internal-auth/policy";
import {
  applyInternalAuthCookies,
  createInternalAuthRouteClient,
} from "@/lib/internal-auth/supabase.server";

export const dynamic = "force-dynamic";

function cleanRedirect(pathname: string, error?: string) {
  const url = new URL(pathname, resolveInternalAuthOrigin());
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  if (!isSafeCallbackRequest(requestUrl)) {
    return applyInternalAuthCookies(
      cleanRedirect(INTERNAL_LOGIN_PATH, AUTH_ERROR_CODES.invalidCallback),
      [],
      new Headers(),
    );
  }

  const { client, pendingCookies, pendingHeaders } =
    createInternalAuthRouteClient(request);
  const code = requestUrl.searchParams.get("code")!;
  const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    await client.auth.signOut({ scope: "local" });
    return applyInternalAuthCookies(
      cleanRedirect(INTERNAL_LOGIN_PATH, AUTH_ERROR_CODES.exchangeFailed),
      pendingCookies,
      pendingHeaders,
    );
  }

  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data.user || !isApprovedReviewer(data.user)) {
    await client.auth.signOut({ scope: "local" });
    return applyInternalAuthCookies(
      cleanRedirect(INTERNAL_LOGIN_PATH, AUTH_ERROR_CODES.notAuthorized),
      pendingCookies,
      pendingHeaders,
    );
  }

  return applyInternalAuthCookies(
    cleanRedirect(callbackDestination(requestUrl)),
    pendingCookies,
    pendingHeaders,
  );
}
