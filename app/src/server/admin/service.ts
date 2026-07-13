import { prisma } from "@/server/db"

import { logAdminEvent } from "./log"

type ContentStatusUpdate = { active?: boolean; sortOrder?: number }

/**
 * Updates the single mutable `RewardConfig` row's `dailyRewardAmount`.
 * Non-retroactive by construction: `DailyReward.amount` snapshots the amount
 * at grant time (see `claimDailyReward`), so this update only affects claims
 * made *after* it. No version field — last-write-wins on concurrent admin
 * edits is an accepted tradeoff for this phase (see phase-08 brief).
 */
export async function updateRewardConfig(
  adminUserId: string,
  dailyRewardAmount: number,
) {
  const current = await prisma.rewardConfig.findFirst({
    orderBy: { createdAt: "desc" },
  })
  if (!current) {
    throw new Error("Reward config is not seeded")
  }

  if (dailyRewardAmount === current.dailyRewardAmount) {
    return current
  }

  const updated = await prisma.rewardConfig.update({
    where: { id: current.id },
    data: { dailyRewardAmount },
  })

  logAdminEvent("admin.reward_config.updated", {
    adminUserId,
    entityId: current.id,
    changes: {
      dailyRewardAmount: {
        before: current.dailyRewardAmount,
        after: updated.dailyRewardAmount,
      },
    },
  })

  return updated
}

/**
 * Partial update of `riceCost`/`active` on one `Voucher` row, by id.
 * Non-retroactive: `VoucherRedemption.riceCostSnapshot`/`...Snapshot` fields
 * capture the value at redeem time (see `redeemVoucher`), so this only
 * affects redemptions made after the change. Only fields actually passed
 * (and actually different) are written and logged.
 */
export async function updateVoucher(
  adminUserId: string,
  voucherId: string,
  input: { riceCost?: number; active?: boolean },
) {
  const current = await prisma.voucher.findUnique({
    where: { id: voucherId },
  })
  if (!current) {
    throw new Error("Voucher not found")
  }

  const data: { riceCost?: number; active?: boolean } = {}
  const changes: Record<string, { before: unknown; after: unknown }> = {}

  if (input.riceCost !== undefined && input.riceCost !== current.riceCost) {
    data.riceCost = input.riceCost
    changes.riceCost = { before: current.riceCost, after: input.riceCost }
  }
  if (input.active !== undefined && input.active !== current.active) {
    data.active = input.active
    changes.active = { before: current.active, after: input.active }
  }

  if (Object.keys(data).length === 0) {
    return current
  }

  const updated = await prisma.voucher.update({
    where: { id: voucherId },
    data,
  })

  logAdminEvent("admin.voucher.updated", {
    adminUserId,
    entityId: voucherId,
    changes,
  })

  return updated
}

/**
 * Partial update of `active`/`sortOrder` on one `Track` row, by id. Reflects
 * immediately in the USER-facing catalog (`listActiveTracks`/`getTrackDetail`
 * in `learning/queries.ts`, which always reads the live `active`/`sortOrder`
 * — no snapshot for content, unlike reward/voucher transactions).
 */
export async function updateTrackStatus(
  adminUserId: string,
  id: string,
  input: ContentStatusUpdate,
) {
  const current = await prisma.track.findUnique({ where: { id } })
  if (!current) {
    throw new Error("Track not found")
  }

  const { data, changes } = diffContentStatus(current, input)
  if (Object.keys(data).length === 0) {
    return current
  }

  const updated = await prisma.track.update({ where: { id }, data })
  logAdminEvent("admin.track.updated", { adminUserId, entityId: id, changes })
  return updated
}

/** Same contract as `updateTrackStatus`, for `Module`. */
export async function updateModuleStatus(
  adminUserId: string,
  id: string,
  input: ContentStatusUpdate,
) {
  const current = await prisma.module.findUnique({ where: { id } })
  if (!current) {
    throw new Error("Module not found")
  }

  const { data, changes } = diffContentStatus(current, input)
  if (Object.keys(data).length === 0) {
    return current
  }

  const updated = await prisma.module.update({ where: { id }, data })
  logAdminEvent("admin.module.updated", { adminUserId, entityId: id, changes })
  return updated
}

/** Same contract as `updateTrackStatus`, for `Activity`. */
export async function updateActivityStatus(
  adminUserId: string,
  id: string,
  input: ContentStatusUpdate,
) {
  const current = await prisma.activity.findUnique({ where: { id } })
  if (!current) {
    throw new Error("Activity not found")
  }

  const { data, changes } = diffContentStatus(current, input)
  if (Object.keys(data).length === 0) {
    return current
  }

  const updated = await prisma.activity.update({ where: { id }, data })
  logAdminEvent("admin.activity.updated", {
    adminUserId,
    entityId: id,
    changes,
  })
  return updated
}

function diffContentStatus(
  current: { active: boolean; sortOrder: number },
  input: ContentStatusUpdate,
) {
  const data: ContentStatusUpdate = {}
  const changes: Record<string, { before: unknown; after: unknown }> = {}

  if (input.active !== undefined && input.active !== current.active) {
    data.active = input.active
    changes.active = { before: current.active, after: input.active }
  }
  if (input.sortOrder !== undefined && input.sortOrder !== current.sortOrder) {
    data.sortOrder = input.sortOrder
    changes.sortOrder = { before: current.sortOrder, after: input.sortOrder }
  }

  return { data, changes }
}
