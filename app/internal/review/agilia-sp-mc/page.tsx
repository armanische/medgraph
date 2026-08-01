import { connection } from "next/server";
import { redirect } from "next/navigation";

import { GENERIC_REVIEW_QUEUE_PATH } from "@/lib/internal-auth/constants";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";

export const dynamic = "force-dynamic";

export default async function AgiliaReviewPage() {
  await connection();
  await requireTrustedReviewer();
  redirect(GENERIC_REVIEW_QUEUE_PATH);
}
