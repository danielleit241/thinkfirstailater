"use server"

import { revalidatePath } from "next/cache"
import { headers as nextHeaders } from "next/headers"

import { requireRole } from "@/server/auth/guards"

import {
  updateContentStatusSchema,
  updateRewardConfigSchema,
  updateVoucherSchema,
} from "./schemas"
import {
  updateActivityStatus,
  updateModuleStatus,
  updateRewardConfig,
  updateTrackStatus,
  updateVoucher,
} from "./service"

/**
 * Every action below calls `requireRole(headers, "ADMIN")` itself, first —
 * the `(admin)/layout.tsx` role gate only protects page rendering, it is not
 * authorization for a mutation. A USER (or anonymous caller) invoking this
 * action directly — e.g. by calling the server action id without going
 * through the admin UI — is rejected here before any read/write happens.
 */
export async function updateRewardConfigAction(dailyRewardAmount: number) {
  const session = await requireRole(await nextHeaders(), "ADMIN")
  const input = updateRewardConfigSchema.parse({ dailyRewardAmount })

  const result = await updateRewardConfig(
    session.user.id,
    input.dailyRewardAmount,
  )
  revalidatePath("/admin")
  return result
}

export async function updateVoucherAction(
  voucherId: string,
  input: { riceCost?: number; active?: boolean },
) {
  const session = await requireRole(await nextHeaders(), "ADMIN")
  const parsed = updateVoucherSchema.parse({ voucherId, ...input })

  const result = await updateVoucher(session.user.id, parsed.voucherId, {
    riceCost: parsed.riceCost,
    active: parsed.active,
  })
  revalidatePath("/admin")
  revalidatePath("/vouchers")
  return result
}

export async function updateTrackStatusAction(
  id: string,
  input: { active?: boolean; sortOrder?: number },
) {
  const session = await requireRole(await nextHeaders(), "ADMIN")
  const parsed = updateContentStatusSchema.parse({ id, ...input })

  const result = await updateTrackStatus(session.user.id, parsed.id, {
    active: parsed.active,
    sortOrder: parsed.sortOrder,
  })
  revalidatePath("/admin")
  revalidatePath("/catalog")
  return result
}

export async function updateModuleStatusAction(
  id: string,
  input: { active?: boolean; sortOrder?: number },
) {
  const session = await requireRole(await nextHeaders(), "ADMIN")
  const parsed = updateContentStatusSchema.parse({ id, ...input })

  const result = await updateModuleStatus(session.user.id, parsed.id, {
    active: parsed.active,
    sortOrder: parsed.sortOrder,
  })
  revalidatePath("/admin")
  revalidatePath("/catalog")
  return result
}

export async function updateActivityStatusAction(
  id: string,
  input: { active?: boolean; sortOrder?: number },
) {
  const session = await requireRole(await nextHeaders(), "ADMIN")
  const parsed = updateContentStatusSchema.parse({ id, ...input })

  const result = await updateActivityStatus(session.user.id, parsed.id, {
    active: parsed.active,
    sortOrder: parsed.sortOrder,
  })
  revalidatePath("/admin")
  revalidatePath("/catalog")
  return result
}
