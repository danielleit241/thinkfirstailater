import { randomUUID } from "node:crypto"

import { Prisma } from "@/generated/prisma/client"
import { logRewardEvent } from "@/server/rewards/log"
import { prisma } from "@/server/db"

export type VoucherRedemptionSummary = {
  id: string
  voucherId: string
  voucherTitleSnapshot: string
  voucherBrandSnapshot: string
  riceCostSnapshot: number
  createdAt: string
}

export type RedeemVoucherResult =
  | {
      status: "redeemed"
      redemption: VoucherRedemptionSummary
      balance: number
    }
  | {
      status: "already_redeemed"
      redemption: VoucherRedemptionSummary
      balance: number
    }
  | { status: "insufficient_balance"; balance: number }
  | { status: "voucher_unavailable" }

function toSummary(redemption: {
  id: string
  voucherId: string
  voucherTitleSnapshot: string
  voucherBrandSnapshot: string
  riceCostSnapshot: number
  createdAt: Date
}): VoucherRedemptionSummary {
  return {
    id: redemption.id,
    voucherId: redemption.voucherId,
    voucherTitleSnapshot: redemption.voucherTitleSnapshot,
    voucherBrandSnapshot: redemption.voucherBrandSnapshot,
    riceCostSnapshot: redemption.riceCostSnapshot,
    createdAt: redemption.createdAt.toISOString(),
  }
}

/**
 * Redeems one active `Voucher` (by stable `slug`) for `userId`, spending
 * `voucher.riceCost` rice. `idempotencyKey` is caller-supplied (see
 * `redeemVoucherAction`) and is the sole thing that makes a retried/
 * double-submitted request safe.
 *
 * Idempotency: the DB-level unique constraint on `(userId, idempotencyKey)`
 * — not any in-memory lock/Set — is the final arbiter for "has this exact
 * redemption request already succeeded?". Two concurrent calls with the same
 * key both attempt `voucherRedemption.create`; the DB accepts exactly one and
 * rejects the other with Prisma P2002, which is caught here and treated as
 * "already redeemed" (idempotent replay, no second debit).
 *
 * Sufficiency + debit: unlike `claimDailyReward`, "is the balance sufficient"
 * has no unique constraint to arbitrate it, so a plain read-then-write
 * (`findUnique` then `update`) would let two concurrent *different* requests
 * (different idempotency keys) both read the same pre-debit balance under
 * Postgres's default READ COMMITTED isolation and both proceed — a classic
 * TOCTOU race that lets balance go negative. Instead, the check-and-debit is
 * one atomic conditional `UPDATE ... WHERE balance >= cost RETURNING balance`
 * raw statement: Postgres takes a row lock for the UPDATE, so a second
 * concurrent transaction blocks until the first commits, then re-evaluates
 * the WHERE clause against the now-current (already-debited) balance — it
 * cannot see the stale pre-debit value. Zero rows affected means
 * insufficient balance, with no other writes made.
 */
export async function redeemVoucher(
  userId: string,
  voucherSlug: string,
  idempotencyKey: string,
): Promise<RedeemVoucherResult> {
  const voucher = await prisma.voucher.findUnique({
    where: { slug: voucherSlug },
  })

  if (!voucher || !voucher.active) {
    logRewardEvent("reward.redeem.failed", {
      userId,
      voucherSlug,
      reason: "voucher_unavailable",
    })
    return { status: "voucher_unavailable" }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "rice_balance" ("userId", "balance", "updatedAt")
        VALUES (${userId}, 0, now())
        ON CONFLICT ("userId") DO NOTHING
      `

      const debited = await tx.$queryRaw<{ balance: number }[]>`
        UPDATE "rice_balance"
        SET "balance" = "balance" - ${voucher.riceCost}, "updatedAt" = now()
        WHERE "userId" = ${userId} AND "balance" >= ${voucher.riceCost}
        RETURNING "balance"
      `

      if (debited.length === 0) {
        const balanceRow = await tx.riceBalance.findUnique({
          where: { userId },
        })
        return {
          status: "insufficient_balance" as const,
          balance: balanceRow?.balance ?? 0,
        }
      }

      const redemptionId = randomUUID()
      const ledgerEntryId = randomUUID()

      const redemption = await tx.voucherRedemption.create({
        data: {
          id: redemptionId,
          userId,
          voucherId: voucher.id,
          idempotencyKey,
          riceCostSnapshot: voucher.riceCost,
          voucherTitleSnapshot: voucher.title,
          voucherBrandSnapshot: voucher.brand,
          ledgerEntryId,
        },
      })

      await tx.riceLedgerEntry.create({
        data: {
          id: ledgerEntryId,
          userId,
          amount: -voucher.riceCost,
          entryType: "VOUCHER_REDEMPTION",
          referenceId: redemption.id,
        },
      })

      return {
        status: "redeemed" as const,
        redemption: toSummary(redemption),
        balance: debited[0]!.balance,
      }
    })

    if (result.status === "redeemed") {
      logRewardEvent("reward.redeem.success", {
        userId,
        voucherSlug,
      })
    } else {
      logRewardEvent("reward.redeem.insufficient_balance", {
        userId,
        voucherSlug,
      })
    }

    return result
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingRedemption = await prisma.voucherRedemption.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
      })
      const existingBalance = await prisma.riceBalance.findUnique({
        where: { userId },
      })

      logRewardEvent("reward.redeem.already_redeemed", {
        userId,
        voucherSlug,
      })

      if (!existingRedemption) {
        // Should not happen (the P2002 was on this exact constraint), but
        // fail closed rather than fabricate a redemption.
        throw error
      }

      return {
        status: "already_redeemed",
        redemption: toSummary(existingRedemption),
        balance: existingBalance?.balance ?? 0,
      }
    }

    logRewardEvent("reward.redeem.failed", {
      userId,
      voucherSlug,
      reason: "unknown_error",
    })
    throw error
  }
}
