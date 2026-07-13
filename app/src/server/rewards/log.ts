type RewardLogEvent =
  | "reward.daily_claim.granted"
  | "reward.daily_claim.already_claimed"
  | "reward.daily_claim.failed"
  | "reward.redeem.success"
  | "reward.redeem.insufficient_balance"
  | "reward.redeem.already_redeemed"
  | "reward.redeem.failed"

/**
 * Structured, PII-free reward observability log: claim/redeem outcome plus
 * stable ids only (`userId`, `activityId`/`voucherSlug`, `businessDate`) —
 * never email/name/token.
 */
export function logRewardEvent(
  event: RewardLogEvent,
  meta: {
    userId: string
    activityId?: string
    businessDate?: string
    streakCount?: number
    voucherSlug?: string
    reason?: string
  },
) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...meta }))
}
