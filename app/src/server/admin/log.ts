type AdminLogEvent =
  | "admin.reward_config.updated"
  | "admin.voucher.updated"
  | "admin.track.updated"
  | "admin.module.updated"
  | "admin.activity.updated"

/**
 * Structured, PII-free admin observability log — same shape as
 * `logRewardEvent`/`logAuthEvent` (`console.log(JSON.stringify(...))`).
 * `adminUserId`/`entityId` are stable ids only (never email/name/session);
 * `changes` records only the fields the mutation actually touched
 * (before/after), never a full row dump.
 */
export function logAdminEvent(
  event: AdminLogEvent,
  meta: {
    adminUserId: string
    entityId: string
    changes: Record<string, { before: unknown; after: unknown }>
  },
) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...meta }))
}
