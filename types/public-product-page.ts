export interface PublicProductCharacteristic {
  label: string;
  value: string;
}

export interface PublicProductClaim {
  code: string;
  displayName: string;
  formattedValue: string;
  publicationKey: string;
  sourceId: string;
  scope: {
    summary: string;
    appliesTo: string[];
  };
  limitations: string[];
}

export interface PublicProductSource {
  id: string;
  source: {
    name: string;
    type: string;
  };
  document: {
    title: string;
    type: string;
    url: string;
  };
  documentVersion: {
    label: string;
  };
  evidence: {
    locator: string;
    excerpt: string;
  };
  verification: {
    status: string;
    verifiedAt: string;
  };
  publication: {
    status: string;
    publishedAt: string;
    publicKey: string;
  };
}

export interface PublicProductPublicationEvent {
  event: string;
  effectiveAt: string;
  title: string;
  description: string;
  publicationKey: string;
}

export interface PublicProductPage {
  slug: string;
  name: string;
  manufacturer: string;
  category: string;
  description: string;
  heroImage: {
    src: string;
    alt: string;
  };
  registration: {
    number: string;
    status: string;
  };
  publication: {
    status: string;
    publishedAt: string;
    verifiedAt: string;
  };
  characteristics: PublicProductCharacteristic[];
  claims: PublicProductClaim[];
  keySummary: string[];
  sources: PublicProductSource[];
  publicationHistory: PublicProductPublicationEvent[];
}

export interface PublicProductPageRow {
  product_id: string;
  locale: string;
  page_payload: unknown;
  projection_version: number;
  built_at: string;
}
