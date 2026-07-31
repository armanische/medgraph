import { NextRequest, NextResponse } from "next/server";

import { isApprovedReviewer, resolveInternalAuthOrigin } from "@/lib/internal-auth/policy";
import {
  applyInternalAuthCookies,
  createInternalAuthRouteClient,
} from "@/lib/internal-auth/supabase.server";
import {
  CATALOG_WAVE_1_MANIFEST_SHA256,
  validateCatalogWave1OperationRequest,
} from "@/lib/operations/catalog-wave-1-manifest";
import {
  CatalogWave1RunnerError,
  executeProductionCatalogWave1,
} from "@/lib/operations/catalog-wave-1-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EXPECTED_ADMIN_ID = "0a5270ac-66f2-4711-9701-e0557fcff73a";

type InternalAccessResult = {
  userId?: unknown;
  role?: unknown;
  allowed?: unknown;
};

function isExactAdminAccess(value: unknown): value is InternalAccessResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const access = value as InternalAccessResult;
  return access.userId === EXPECTED_ADMIN_ID
    && access.role === "admin"
    && access.allowed === true;
}

function safeJson(
  body: Readonly<Record<string, unknown>>,
  status: number,
  auth: ReturnType<typeof createInternalAuthRouteClient>,
) {
  const response = NextResponse.json(body, { status });
  return applyInternalAuthCookies(response, auth.pendingCookies, auth.pendingHeaders);
}

function productionEnvironmentPresent() {
  return Boolean(
    process.env.CYBERMEDICA_SUPABASE_URL?.trim()
    && process.env.CYBERMEDICA_SUPABASE_PROJECT_REF?.trim()
    && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export async function POST(request: NextRequest) {
  const auth = createInternalAuthRouteClient(request);
  if (process.env.VERCEL_ENV !== "production") {
    return safeJson({ status: "blocked", code: "production_only" }, 403, auth);
  }

  let canonicalOrigin: string;
  try {
    canonicalOrigin = resolveInternalAuthOrigin();
  } catch {
    return safeJson({ status: "blocked", code: "auth_configuration" }, 503, auth);
  }
  if (
    request.nextUrl.origin !== canonicalOrigin
    || request.headers.get("origin") !== canonicalOrigin
    || request.headers.get("sec-fetch-site") !== "same-origin"
    || request.headers.get("content-type")?.split(";", 1)[0] !== "application/json"
  ) {
    return safeJson({ status: "blocked", code: "same_origin_required" }, 403, auth);
  }

  const { data: authData, error: authError } = await auth.client.auth.getUser();
  if (authError || !authData.user || !isApprovedReviewer(authData.user)) {
    return safeJson({ status: "blocked", code: "authentication_required" }, 401, auth);
  }
  const { data: accessData, error: accessError } = await auth.client
    .schema("cloud_api")
    .rpc("current_internal_access_v1");
  if (accessError || !isExactAdminAccess(accessData) || accessData.userId !== authData.user.id) {
    return safeJson({ status: "blocked", code: "admin_required" }, 403, auth);
  }

  const rawBody = await request.text();
  if (rawBody.length > 512) {
    return safeJson({ status: "blocked", code: "invalid_operation_manifest" }, 400, auth);
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return safeJson({ status: "blocked", code: "invalid_operation_manifest" }, 400, auth);
  }
  if (!validateCatalogWave1OperationRequest(body)) {
    return safeJson({ status: "blocked", code: "invalid_operation_manifest" }, 400, auth);
  }
  if (!productionEnvironmentPresent()) {
    return safeJson({ status: "blocked", code: "service_configuration_missing" }, 503, auth);
  }

  try {
    const result = await executeProductionCatalogWave1();
    return safeJson({
      status: result.status,
      operationKey: result.operationKey,
      manifestSha256: CATALOG_WAVE_1_MANIFEST_SHA256,
      approvals: result.approvals,
      publications: result.publications,
      totals: result.totals,
      remainingReviewedUnpublished: result.remainingReviewedUnpublished,
    }, 200, auth);
  } catch (error) {
    const code = error instanceof CatalogWave1RunnerError
      ? error.code
      : "operation_failed";
    return safeJson({ status: "blocked", code }, 409, auth);
  }
}
