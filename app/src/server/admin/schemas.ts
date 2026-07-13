import { z } from "zod"

/** Daily reward amount must stay a positive integer (0/negative rice makes no sense). */
export const updateRewardConfigSchema = z.object({
  dailyRewardAmount: z.number().int().positive(),
})

/**
 * Partial update: at least one of `riceCost`/`active` must be present, so a
 * no-op call is rejected before it reaches the service (which would otherwise
 * silently no-op and still be logged as a change).
 */
export const updateVoucherSchema = z
  .object({
    voucherId: z.string().min(1),
    riceCost: z.number().int().positive().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) => value.riceCost !== undefined || value.active !== undefined,
    {
      message: "riceCost hoặc active phải có ít nhất một giá trị",
    },
  )

/** Shared shape for Track/Module/Activity — only `active`/`sortOrder` are editable. */
export const updateContentStatusSchema = z
  .object({
    id: z.string().min(1),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(
    (value) => value.active !== undefined || value.sortOrder !== undefined,
    {
      message: "active hoặc sortOrder phải có ít nhất một giá trị",
    },
  )

export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>
export type UpdateContentStatusInput = z.infer<typeof updateContentStatusSchema>
