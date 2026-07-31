import GroupBSixPublicationExecutionAction from "@/components/internal/GroupBSixPublicationExecutionAction";

export const dynamic = "force-dynamic";

export default function ExecuteGroupBSixPublicationPage() {
  return (
    <main style={{ margin: "4rem auto", maxWidth: "42rem", padding: "0 1rem" }}>
      <h1>Group B Six Publication</h1>
      <p>
        Controlled one-time operation for the exact six-product immutable manifest.
        The server revalidates Production state, reviewer identity and scope before writes.
      </p>
      <GroupBSixPublicationExecutionAction />
    </main>
  );
}
