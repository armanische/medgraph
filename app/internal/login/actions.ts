"use server";

import { redirect } from "next/navigation";

import {
  AUTH_ERROR_CODES,
  GENERIC_REVIEW_QUEUE_PATH,
  INTERNAL_LOGIN_PATH,
} from "@/lib/internal-auth/constants";
import {
  approvedCallbackUrl,
  isApprovedLoginEmail,
  resolveInternalReviewDestination,
} from "@/lib/internal-auth/policy";
import { createInternalAuthServerClient } from "@/lib/internal-auth/supabase.server";

function formField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function classifyAuthError(error: unknown) {
  const candidate = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = typeof candidate.status === "number" ? candidate.status : undefined;
  const text = [candidate.code, candidate.name, candidate.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  if (status === 429 || /rate.?limit|too many|email rate/u.test(text)) {
    return AUTH_ERROR_CODES.emailRateLimited;
  }
  if (/invalid.*email|email.*not allowed|user.*not found|signup.*disabled/u.test(text)) {
    return AUTH_ERROR_CODES.emailNotAllowed;
  }
  if (/environment|configuration|origin|supabase.*url|anon.*key|not configured/u.test(text)) {
    return AUTH_ERROR_CODES.authConfigurationError;
  }
  return AUTH_ERROR_CODES.authProviderError;
}

export async function requestInternalMagicLink(formData: FormData) {
  const email = formField(formData, "email");
  const destination = resolveInternalReviewDestination(formField(formData, "next"));
  const destinationQuery = destination === GENERIC_REVIEW_QUEUE_PATH
    ? ""
    : `&next=${encodeURIComponent(destination)}`;
  if (!isApprovedLoginEmail(email)) {
    redirect(`${INTERNAL_LOGIN_PATH}?status=sent${destinationQuery}`);
  }

  let errorCode: string | undefined;
  try {
    const supabase = await createInternalAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: destination === GENERIC_REVIEW_QUEUE_PATH
          ? approvedCallbackUrl()
          : approvedCallbackUrl(destination),
      },
    });
    if (error) errorCode = classifyAuthError(error);
  } catch {
    errorCode = AUTH_ERROR_CODES.authConfigurationError;
  }

  if (errorCode) {
    redirect(`${INTERNAL_LOGIN_PATH}?error=${errorCode}${destinationQuery}`);
  }

  redirect(`${INTERNAL_LOGIN_PATH}?status=sent${destinationQuery}`);
}
