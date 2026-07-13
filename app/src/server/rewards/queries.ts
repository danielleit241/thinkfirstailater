import { prisma } from "@/server/db"

export type RewardHistoryItem = {
  id: string
  businessDate: string
  amount: number
  streakCount: number
}

export type RewardSummary = {
  balance: number
  currentStreak: number
  history: RewardHistoryItem[]
}

/**
 * Read-only summary for the dashboard: current balance, current streak (the
 * `streakCount` of the most recent `DailyReward`, 0 if the user has never
 * been granted one), and a short recent-history list. Always scoped by the
 * `userId` the caller passes in (from the caller's own session).
 */
export async function getRewardSummary(
  userId: string,
  historyLimit = 5,
): Promise<RewardSummary> {
  const [balanceRow, recentRewards] = await Promise.all([
    prisma.riceBalance.findUnique({ where: { userId } }),
    prisma.dailyReward.findMany({
      where: { userId },
      orderBy: { businessDate: "desc" },
      take: historyLimit,
    }),
  ])

  return {
    balance: balanceRow?.balance ?? 0,
    currentStreak: recentRewards[0]?.streakCount ?? 0,
    history: recentRewards.map((reward) => ({
      id: reward.id,
      businessDate: reward.businessDate.toISOString().slice(0, 10),
      amount: reward.amount,
      streakCount: reward.streakCount,
    })),
  }
}
