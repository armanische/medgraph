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

export function internalReviewEnabled(input?: {
  env?: NodeJS.ProcessEnv;
  nodeEnv?: string;
}) {
  const env = input?.env ?? process.env;
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV;
  return nodeEnv !== "production" || env.CYBERMEDICA_ENABLE_INTERNAL_REVIEW === "1";
}
