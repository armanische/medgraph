import { z } from "zod";

export const PRODUCT_PUBLICATION_SCHEMA_VERSION = 1 as const;

const uuidSchema = z.string().uuid();
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const idempotencyKeySchema = z.string().trim().min(8).max(200);

export const createProductPublicationRevisionInputSchema = z.object({
  productId: uuidSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict();

export const approveProductPublicationRevisionInputSchema = z.object({
  candidateRevisionId: uuidSchema,
  reviewDecisionId: uuidSchema,
}).strict();

export const publishProductInputSchema = z.object({
  candidateRevisionId: uuidSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict();

export const archiveProductInputSchema = z.object({
  productId: uuidSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict();

export const rollbackProductPublicationInputSchema = z.object({
  publicationBatchId: uuidSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict();

export const productPublicationRevisionResultSchema = z.object({
  candidateRevisionId: uuidSchema,
  productId: uuidSchema,
  reviewItemId: uuidSchema,
  revisionNumber: z.number().int().positive(),
  schemaVersion: z.literal(PRODUCT_PUBLICATION_SCHEMA_VERSION),
  payloadChecksum: checksumSchema,
  productIdentityChecksum: checksumSchema,
  state: z.literal("in_review"),
  idempotent: z.boolean(),
}).strict();

export const productPublicationApprovalResultSchema = z.object({
  approvalId: uuidSchema,
  candidateRevisionId: uuidSchema,
  productId: uuidSchema,
  state: z.literal("approved"),
  payloadChecksum: checksumSchema,
  idempotent: z.boolean(),
}).strict();

export const productPublicationActionResultSchema = z.object({
  publicationBatchId: uuidSchema,
  candidateRevisionId: uuidSchema.nullable(),
  productId: uuidSchema,
  action: z.enum(["publish", "archive", "rollback"]),
  state: z.enum(["approved", "published", "archived"]),
  publicationVersion: z.number().int().nonnegative(),
  idempotent: z.boolean(),
}).strict();

export type CreateProductPublicationRevisionInput = z.infer<
  typeof createProductPublicationRevisionInputSchema
>;
export type ApproveProductPublicationRevisionInput = z.infer<
  typeof approveProductPublicationRevisionInputSchema
>;
export type PublishProductInput = z.infer<typeof publishProductInputSchema>;
export type ArchiveProductInput = z.infer<typeof archiveProductInputSchema>;
export type RollbackProductPublicationInput = z.infer<
  typeof rollbackProductPublicationInputSchema
>;
