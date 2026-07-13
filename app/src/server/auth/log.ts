type AuthLogEvent =
  | "auth.register.success"
  | "auth.register.failed"
  | "auth.register.rate_limited"
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.login.rate_limited"

/**
 * Structured, PII-free auth observability log: outcome/error *category*
 * only. Never pass email, password, token, or session id in `meta` — the
 * only allowed metadata today is Better Auth's generic error `code`
 * (e.g. "INVALID_EMAIL_OR_PASSWORD", "USER_ALREADY_EXISTS"), which is not
 * user-identifying.
 */
export function logAuthEvent(
  event: AuthLogEvent,
  meta?: Record<string, string | number>,
) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...meta }))
}
