import type { Metadata } from "next";

const robots: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function internalRouteMetadata(enabled: boolean, title: string): Metadata {
  return {
    title: enabled ? title : "Страница не найдена",
    robots,
  };
}
