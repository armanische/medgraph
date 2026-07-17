import { serializeStorefrontJsonLd } from "@/lib/storefront/seo";
import type { StorefrontStructuredData } from "@/lib/storefront/structured-data";

export default function JsonLd({ data }: { data: StorefrontStructuredData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeStorefrontJsonLd(data) }}
    />
  );
}
