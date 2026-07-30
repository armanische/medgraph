"use server";

import { redirect } from "next/navigation";

import {
  AUTH_ERROR_CODES,
  INTERNAL_LOGIN_PATH,
  MINDRAY_REVIEW_PATH,
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

export async function requestInternalMagicLink(formData: FormData) {
  const email = formField(formData, "email");
  const destination = resolveInternalReviewDestination(formField(formData, "next"));
  const destinationQuery = destination === MINDRAY_REVIEW_PATH
    ? `&next=${encodeURIComponent(destination)}`
    : "";
  if (!isApprovedLoginEmail(email)) {
    redirect(`${INTERNAL_LOGIN_PATH}?status=sent${destinationQuery}`);
  }

  try {
    const supabase = await createInternalAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: destination === "/internal/review/hamilton-t1"
          ? approvedCallbackUrl()
          : approvedCallbackUrl(destination),
      },
    });
    if (error) {
      redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.loginUnavailable}${destinationQuery}`);
    }
  } catch {
    redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.loginUnavailable}${destinationQuery}`);
  }

  redirect(`${INTERNAL_LOGIN_PATH}?status=sent${destinationQuery}`);
}
