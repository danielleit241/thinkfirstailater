/**
 * Reward config seed (Phase 6). Idempotent: ensures exactly one
 * `RewardConfig` row exists with a sensible default daily reward amount.
 * Running this repeatedly never creates a second row and never resets an
 * amount an admin (Phase 8) may have already changed.
 */
import { prisma } from "@/server/db"

const DEFAULT_DAILY_REWARD_AMOUNT = 10

export async function seedRewardConfig() {
  const existing = await prisma.rewardConfig.findFirst({
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    return existing
  }

  return prisma.rewardConfig.create({
    data: { dailyRewardAmount: DEFAULT_DAILY_REWARD_AMOUNT },
  })
}
