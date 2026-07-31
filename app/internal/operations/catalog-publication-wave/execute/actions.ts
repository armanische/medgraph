"use server";

import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { hasExactCatalogWave1AdminProfile } from "@/lib/operations/catalog-wave-1-admin";
import {
  CatalogWave1RunnerError,
  executeProductionCatalogWave1,
} from "@/lib/operations/catalog-wave-1-runner";
import { createProjectBoundSupabaseServerClient } from "@/lib/supabase/client.server";

const EXPECTED_ADMIN_ID = "0a5270ac-66f2-4711-9701-e0557fcff73a";

export type CatalogWave1ActionState = {
  status: "idle" | "completed" | "already_completed" | "blocked";
  message: string;
  published?: number;
  approvals?: number;
  publicationBatches?: number;
  remainingReviewedUnpublished?: number;
};

function productionEnvironmentPresent() {
  return Boolean(
    process.env.CYBERMEDICA_SUPABASE_URL?.trim()
    && process.env.CYBERMEDICA_SUPABASE_PROJECT_REF?.trim()
    && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export async function executeCatalogWave1Action(): Promise<CatalogWave1ActionState> {
  if (process.env.VERCEL_ENV !== "production") {
    return { status: "blocked", message: "Operation is Production-only." };
  }
  const user = await requireTrustedReviewer();
  if (user.id !== EXPECTED_ADMIN_ID || !productionEnvironmentPresent()) {
    return { status: "blocked", message: "Operation authorization failed closed." };
  }

  const serviceClient = createProjectBoundSupabaseServerClient();
  if (!await hasExactCatalogWave1AdminProfile(serviceClient, user.id)) {
    return { status: "blocked", message: "Operation authorization failed closed." };
  }

  try {
    const result = await executeProductionCatalogWave1();
    return {
      status: result.status,
      message: result.status === "completed"
        ? "Wave 1 completed and durably verified."
        : "Wave 1 was already complete; no duplicate writes were created.",
      published: result.totals.published,
      approvals: result.totals.approvals,
      publicationBatches: result.totals.publicationBatches,
      remainingReviewedUnpublished: result.remainingReviewedUnpublished,
    };
  } catch (error) {
    const code = error instanceof CatalogWave1RunnerError ? error.code : "operation_failed";
    return { status: "blocked", message: `Operation failed closed: ${code}.` };
  }
}
