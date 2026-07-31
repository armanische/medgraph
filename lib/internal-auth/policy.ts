import {
  AGILIA_REVIEW_PATH,
  APPROVED_REVIEWER,
  FUTURE_CORPORATE_REVIEWER_EMAIL,
  GENERIC_REVIEW_QUEUE_PATH,
  HAMILTON_REVIEW_PATH,
  MINDRAY_REVIEW_PATH,
  SENSITIVE_AUTH_PARAMETERS,
} from "./constants.ts";

const productionOrigins = new Set([
  "https://cyber-medica.ru",
  "https://medgraph-medgraph.vercel.app",
]);
const canonicalProductionOrigin = "https://cyber-medica.ru";

const approvedReviewDestinations = new Set([
  GENERIC_REVIEW_QUEUE_PATH,
  HAMILTON_REVIEW_PATH,
  MINDRAY_REVIEW_PATH,
  AGILIA_REVIEW_PATH,
]);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isApprovedReviewer(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
}) {
  return user.id === APPROVED_REVIEWER.userId
    && normalizeEmail(user.email ?? "") === APPROVED_REVIEWER.email
    && Boolean(user.email_confirmed_at);
}

export function isApprovedLoginEmail(value: string) {
  const normalized = normalizeEmail(value);
  return normalized === APPROVED_REVIEWER.email
    || normalized === FUTURE_CORPORATE_REVIEWER_EMAIL;
}

export function resolveInternalAuthOrigin(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const value = environment.CYBERMEDICA_INTERNAL_AUTH_ORIGIN?.trim();
  if (!value) throw new Error("Internal Auth origin is not configured.");

  let origin: string;
  try {
    const url = new URL(value);
    if (
      url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      throw new Error("invalid origin");
    }
    origin = url.origin;
  } catch {
    throw new Error("Internal Auth origin is invalid.");
  }

  if (environment.VERCEL_ENV === "production") {
    if (!productionOrigins.has(origin)) {
      throw new Error("Internal Auth Production origin is not approved.");
    }
    return canonicalProductionOrigin;
  }

  if (
    environment.NODE_ENV === "test"
    && (origin === "http://127.0.0.1:3000" || origin === "http://localhost:3000")
  ) {
    return origin;
  }

  throw new Error("Internal Auth origin is not approved for this environment.");
}

export function approvedCallbackUrl(
  destinationOrEnvironment:
    | string
    | Readonly<Record<string, string | undefined>> = GENERIC_REVIEW_QUEUE_PATH,
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const destination = typeof destinationOrEnvironment === "string"
    ? destinationOrEnvironment
    : GENERIC_REVIEW_QUEUE_PATH;
  const runtimeEnvironment = typeof destinationOrEnvironment === "string"
    ? environment
    : destinationOrEnvironment;
  const callback = new URL(`${resolveInternalAuthOrigin(runtimeEnvironment)}/auth/callback`);
  if (!approvedReviewDestinations.has(destination)) {
    throw new Error("Internal Auth destination is not approved.");
  }
  if (destination !== GENERIC_REVIEW_QUEUE_PATH) callback.searchParams.set("next", destination);
  return callback.toString();
}

export function isSafeCallbackRequest(
  requestUrl: URL,
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  if (requestUrl.origin !== resolveInternalAuthOrigin(environment)) return false;
  if (requestUrl.hash) return false;

  const keys = [...requestUrl.searchParams.keys()].map((key) => key.toLowerCase());
  if (keys.some((key) => key !== "code" && key !== "next")) return false;
  if (requestUrl.searchParams.getAll("code").length !== 1) {
    return false;
  }

  const destinations = requestUrl.searchParams.getAll("next");
  if (destinations.length > 1) return false;
  if (destinations.length === 1 && !approvedReviewDestinations.has(destinations[0])) {
    return false;
  }

  const code = requestUrl.searchParams.get("code");
  return typeof code === "string" && code.length >= 8 && code.length <= 4096;
}

export function safeInternalDestination() {
  return GENERIC_REVIEW_QUEUE_PATH;
}

export function resolveInternalReviewDestination(value?: string | null) {
  return value && approvedReviewDestinations.has(value) ? value : GENERIC_REVIEW_QUEUE_PATH;
}

export function callbackDestination(requestUrl: URL) {
  return resolveInternalReviewDestination(requestUrl.searchParams.get("next"));
}

export function redactAuthText(value: string) {
  let redacted = value;
  for (const parameter of SENSITIVE_AUTH_PARAMETERS) {
    redacted = redacted.replace(
      new RegExp(`([?&]${parameter}=)[^&#\\s]*`, "giu"),
      `$1[REDACTED]`,
    );
  }
  redacted = redacted.replace(/\bBearer\s+[^\s]+/giu, "Bearer [REDACTED]");
  redacted = redacted.replace(/\bCookie:\s*[^\r\n]*/giu, "Cookie: [REDACTED]");
  return redacted;
}
