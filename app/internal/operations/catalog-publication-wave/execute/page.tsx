import {
  CATALOG_WAVE_1_MANIFEST_SHA256,
  CATALOG_WAVE_1_OPERATION_KEY,
} from "@/lib/operations/catalog-wave-1-manifest";

export const dynamic = "force-dynamic";

export default function ExecuteCatalogPublicationWavePage() {
  return (
    <main style={{ margin: "4rem auto", maxWidth: "42rem", padding: "0 1rem" }}>
      <h1>Catalog Publication Wave 1</h1>
      <p>
        Controlled one-time operation for the exact reviewed ten-product manifest.
        The server revalidates Production state, reviewer identity and immutable checksums.
      </p>
      <form action="/internal/operations/catalog-publication-wave" method="post">
        <input name="operationKey" type="hidden" value={CATALOG_WAVE_1_OPERATION_KEY} />
        <input name="manifestSha256" type="hidden" value={CATALOG_WAVE_1_MANIFEST_SHA256} />
        <button type="submit">Execute approved Wave 1</button>
      </form>
    </main>
  );
}
