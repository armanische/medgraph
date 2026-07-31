import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/client.server";

const CLOUD_READ_HEADERS = { "Accept-Profile": "cloud" } as const;

type UserProfileRow = { id?: unknown; role?: unknown };

export async function hasExactCatalogWave1AdminProfile(
  client: SupabaseServerClient,
  userId: string,
) {
  if (client.access !== "service_role") return false;
  const query = new URLSearchParams({
    select: "id,role",
    id: `eq.${userId}`,
    limit: "2",
  });
  const response = await client.request(`/rest/v1/user_profiles?${query.toString()}`, {
    headers: CLOUD_READ_HEADERS,
  });
  const value: unknown = await response.json();
  if (!Array.isArray(value) || value.length !== 1) return false;
  const profile = value[0] as UserProfileRow;
  return profile.id === userId && profile.role === "admin";
}
