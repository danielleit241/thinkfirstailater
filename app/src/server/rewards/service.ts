import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/server/db"

import { businessDateDiffInDays, getBusinessDate } from "./clock"
import { logRewardEvent } from "./log"

export type DailyClaimResult = {
  dailyRewardGranted: boolean
  streakCount: number
  balance: number
}

/**
 * Attempts to grant the daily rice reward + streak update for `userId` for
 * the current business date (Asia/Ho_Chi_Minh, via `getBusinessDate`).
 * Called *after* an `ActivityCompletion` has already been durably recorded
 * by the Phase 5 completion service (`submitQuizAnswerAndComplete`/
 * `submitChecklistCompletion`) — this function does not itself validate or
 * record activity completion.
 *
 * Concurrency: the only thing that decides "first completion of the day"
 * is the DB-level unique constraint on `(userId, businessDate)`. Two
 * concurrent calls both attempt `dailyReward.create`; the DB accepts exactly
 * one and rejects the other with a Prisma P2002 error, which is caught here
 * and treated as "already claimed today" — never as an application error,
 * never via any in-memory lock (which would not be correct across multiple
 * instances).
 *
 * Ledger + balance are written atomically in the same `prisma.$transaction`
 * as the `DailyReward` insert: `RiceBalance.balance` is updated via
 * `increment` (never read-then-write), so it can never drift from
 * `SUM(RiceLedgerEntry.amount)`.
 */
export async function claimDailyReward(
  userId: string,
  activityId: string,
  now: Date = new Date(),
): Promise<DailyClaimResult> {
  const businessDate = getBusinessDate(now)
  const businessDateLabel = businessDate.toISOString().slice(0, 10)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.rewardConfig.findFirst({
        orderBy: { createdAt: "desc" },
      })
      if (!config) {
        throw new Error("Reward config is not seeded")
      }

      const lastReward = await tx.dailyReward.findFirst({
        where: { userId },
        orderBy: { businessDate: "desc" },
      })

      let streakCount = 1
      if (lastReward) {
        const diffDays = businessDateDiffInDays(
          lastReward.businessDate,
          businessDate,
        )
        streakCount = diffDays === 1 ? lastReward.streakCount + 1 : 1
      }

      const dailyReward = await tx.dailyReward.create({
        data: {
          userId,
          businessDate,
          amount: config.dailyRewardAmount,
          streakCount,
        },
      })

      await tx.riceLedgerEntry.create({
        data: {
          userId,
          amount: dailyReward.amount,
          entryType: "DAILY_REWARD",
          referenceId: dailyReward.id,
        },
      })

      const balance = await tx.riceBalance.upsert({
        where: { userId },
        create: { userId, balance: dailyReward.amount },
        update: { balance: { increment: dailyReward.amount } },
      })

      return {
        dailyRewardGranted: true,
        streakCount: dailyReward.streakCount,
        balance: balance.balance,
      }
    })

    logRewardEvent("reward.daily_claim.granted", {
      userId,
      activityId,
      businessDate: businessDateLabel,
      streakCount: result.streakCount,
    })

    return result
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const [existingReward, existingBalance] = await Promise.all([
        prisma.dailyReward.findUnique({
          where: { userId_businessDate: { userId, businessDate } },
        }),
        prisma.riceBalance.findUnique({ where: { userId } }),
      ])

      logRewardEvent("reward.daily_claim.already_claimed", {
        userId,
        activityId,
        businessDate: businessDateLabel,
        streakCount: existingReward?.streakCount,
      })

      return {
        dailyRewardGranted: false,
        streakCount: existingReward?.streakCount ?? 0,
        balance: existingBalance?.balance ?? 0,
      }
    }

    logRewardEvent("reward.daily_claim.failed", {
      userId,
      activityId,
      businessDate: businessDateLabel,
    })
    throw error
  }
}
