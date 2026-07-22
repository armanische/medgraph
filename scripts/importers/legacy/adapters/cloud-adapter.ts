import type { PipelineResult } from "../contracts.ts";

/**
 * Reserved external boundary for a future Cloud implementation.
 *
 * This phase provides no implementation, no credentials and no data writes. Any
 * Supabase or Cloud Catalog integration must implement this interface here rather
 * than being imported by the core pipeline.
 */
export interface CloudPipelineAdapter {
  readonly kind: "cloud";
  persist(result: PipelineResult): Promise<void>;
}
