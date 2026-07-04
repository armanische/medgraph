import "server-only";

import type { PublicProductPageRow } from "@/types/public-product-page";

const PUBLIC_SCHEMA = "public_api";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Supabase не настроен. Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

export class SupabaseQueryError extends Error {
  constructor(status: number, message: string) {
    super(`Supabase Data API вернул ${status}: ${message}`);
    this.name = "SupabaseQueryError";
  }
}

interface ServerSupabaseClient {
  getProductPage(slug: string): Promise<PublicProductPageRow | null>;
}

function getEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConfigurationError();
  }

  return { url, anonKey };
}

export function createServerSupabaseClient(): ServerSupabaseClient {
  const { url, anonKey } = getEnvironment();

  return {
    async getProductPage(slug) {
      const endpoint = new URL(`${url}/rest/v1/product_pages`);
      endpoint.searchParams.set(
        "select",
        "product_id,locale,page_payload,projection_version,built_at",
      );
      endpoint.searchParams.set("page_payload->>slug", `eq.${slug}`);
      endpoint.searchParams.set("locale", "eq.ru-RU");
      endpoint.searchParams.set("limit", "1");

      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Accept-Profile": PUBLIC_SCHEMA,
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        const message = (await response.text()).slice(0, 300);
        throw new SupabaseQueryError(response.status, message);
      }

      const rows = (await response.json()) as PublicProductPageRow[];
      return rows[0] ?? null;
    },
  };
}
