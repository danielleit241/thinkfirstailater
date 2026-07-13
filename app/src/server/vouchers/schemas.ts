import { z } from "zod"

/**
 * `idempotencyKey` is client-generated (`crypto.randomUUID()`) once per
 * redeem attempt and resent unchanged on retry — validated as a UUID so a
 * malformed/empty key can never slip through to the unique constraint.
 */
export const redeemVoucherSchema = z.object({
  voucherSlug: z.string().min(1),
  idempotencyKey: z.string().uuid(),
})
