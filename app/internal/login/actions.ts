"use server";

import { redirect } from "next/navigation";

import {
  AUTH_ERROR_CODES,
  INTERNAL_LOGIN_PATH,
} from "@/lib/internal-auth/constants";
import { approvedCallbackUrl, isApprovedLoginEmail } from "@/lib/internal-auth/policy";
import { createInternalAuthServerClient } from "@/lib/internal-auth/supabase.server";

function formField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function requestInternalMagicLink(formData: FormData) {
  const email = formField(formData, "email");
  if (!isApprovedLoginEmail(email)) {
    redirect(`${INTERNAL_LOGIN_PATH}?status=sent`);
  }

  try {
    const supabase = await createInternalAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: approvedCallbackUrl(),
      },
    });
    if (error) {
      redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.loginUnavailable}`);
    }
  } catch {
    redirect(`${INTERNAL_LOGIN_PATH}?error=${AUTH_ERROR_CODES.loginUnavailable}`);
  }

  redirect(`${INTERNAL_LOGIN_PATH}?status=sent`);
}
