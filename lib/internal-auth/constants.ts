export const INTERNAL_AUTH_CALLBACK_PATH = "/auth/callback";
export const HAMILTON_REVIEW_PATH = "/internal/review/hamilton-t1";
export const INTERNAL_LOGIN_PATH = "/internal/login";

export const APPROVED_REVIEWER = Object.freeze({
  userId: "0a5270ac-66f2-4711-9701-e0557fcff73a",
  email: "armansmarkosyan@gmail.com",
  role: "admin",
});

export const HAMILTON_REVIEW = Object.freeze({
  productId: "e66a1165-030b-4aa4-a400-959f1ac70fe3",
  productName: "Hamilton-T1",
  revisionId: "8d48a2b5-0842-4796-803f-4e4daf6f6e17",
  reviewItemId: "68926883-2923-4dce-acea-cdb13ea08ded",
  revisionNumber: 1,
  payloadChecksum:
    "f391551c5eede060365d23440f79dce518d41e7197cee01511a63587da97c2bf",
  candidatePayloadChecksum:
    "70bca4a6707b0b3f52e5bd9535075ca68a31257514e1bf34535e04510a18b562",
  productIdentityChecksum:
    "495e2a41c1527df3748e6ac0cc770bc4321d8044f121416e6792b2597fc3aea2",
  rationale:
    "Reviewed immutable Hamilton-T1 revision 1. Product identity, canonical Russian content, SEO, characteristics, media and approved claims match the current publication candidate. Warnings missing_documents and missing_registration are acknowledged as non-blocking for this lifecycle stage.",
});

export const AUTH_ERROR_CODES = Object.freeze({
  invalidCallback: "AUTH_CALLBACK_INVALID",
  exchangeFailed: "AUTH_CALLBACK_EXCHANGE_FAILED",
  notAuthorized: "AUTH_PROFILE_NOT_AUTHORIZED",
  sessionRequired: "AUTH_SESSION_REQUIRED",
  loginUnavailable: "AUTH_LOGIN_UNAVAILABLE",
});

export const SENSITIVE_AUTH_PARAMETERS = new Set([
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "session",
  "jwt",
]);
