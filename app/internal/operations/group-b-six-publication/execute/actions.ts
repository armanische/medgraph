"use server";

import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import {
  executeProductionGroupBSixPublication,
  GroupBSixPublicationRunnerError,
} from "@/lib/operations/group-b-six-publication-runner";

const EXPECTED_ADMIN_ID = "7e90a993-8b30-4e0d-aff4-a257d5a4a179";

export type GroupBSixPublicationActionState = {
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

export async function executeGroupBSixPublicationAction(): Promise<GroupBSixPublicationActionState> {
  if (process.env.VERCEL_ENV !== "production") {
    return { status: "blocked", message: "Operation is Production-only." };
  }
  const user = await requireTrustedReviewer();
  if (user.id !== EXPECTED_ADMIN_ID || !productionEnvironmentPresent()) {
    return { status: "blocked", message: "Operation authorization failed closed." };
  }

  try {
    const result = await executeProductionGroupBSixPublication();
    return {
      status: result.status,
      message: result.status === "completed"
        ? "Group B six publication completed and durably verified."
        : "Group B six publication was already complete; no duplicate writes were created.",
      published: result.totals.published,
      approvals: result.totals.approvals,
      publicationBatches: result.totals.publicationBatches,
      remainingReviewedUnpublished: result.remainingReviewedUnpublished,
    };
  } catch (error) {
    const code = error instanceof GroupBSixPublicationRunnerError
      ? error.code
      : "operation_failed";
    return { status: "blocked", message: `Operation failed closed: ${code}.` };
  }
}
