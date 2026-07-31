import CatalogWave1ExecutionAction from "@/components/internal/CatalogWave1ExecutionAction";

export const dynamic = "force-dynamic";

export default function ExecuteCatalogPublicationWavePage() {
  return (
    <main style={{ margin: "4rem auto", maxWidth: "42rem", padding: "0 1rem" }}>
      <h1>Catalog Publication Wave 1</h1>
      <p>
        Controlled one-time operation for the exact reviewed ten-product manifest.
        The server revalidates Production state, reviewer identity and immutable checksums.
      </p>
      <CatalogWave1ExecutionAction />
    </main>
  );
}
