import type { Metadata } from "next";
import { connection } from "next/server";

import GroupCBatch3RevisionExecution from "@/components/internal/GroupCBatch3RevisionExecution";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Group C Batch 3 Revision Creation",
  robots: { index: false, follow: false },
};

export default async function GroupCBatch3RevisionExecutionPage() {
  await connection();
  await requireTrustedReviewer();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
        Corporate Production session · exact tracked manifest
      </div>
      <h1 className="mt-3 text-3xl font-semibold">Group C Batch 3 revisions</h1>
      <p className="mt-4 text-slate-700">
        Одноразовая server-only операция для семи утверждённых Products.
        Human Review, Approval и Publication не выполняются.
      </p>
      <GroupCBatch3RevisionExecution />
    </main>
  );
}
