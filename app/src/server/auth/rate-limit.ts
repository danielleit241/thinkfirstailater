type RateLimitConfig = { max: number; windowMs: number }
type Bucket = { count: number; resetAt: number }

/**
 * In-memory sliding-window counter for register/login attempts. Buckets are
 * never evicted (only overwritten on next access to the same key), so a
 * spoofed-key attacker (see below) grows this Map unbounded over time —
 * accepted for the single-process, short-lived-demo scope described here.
 *
 * Scope decision for this demo: a single Next.js process serves the app (see
 * `docker-compose.yml` / deployment target), so an in-memory Map is a
 * sufficient, dependency-free mitigation against brute-force/credential
 * stuffing. It intentionally does NOT survive process restarts and does NOT
 * work across multiple instances — a real multi-instance deployment would
 * need a shared store (Redis/DB-backed counter) instead. Documented as an
 * accepted limitation for the live-demo scope of this phase.
 *
 * The bucket key also embeds the client-supplied `x-forwarded-for` header
 * (see `clientKey()` in the auth Route Handler) with no trusted-proxy
 * validation — a determined attacker can spoof a fresh value per request to
 * get a fresh bucket. Accepted as best-effort mitigation against
 * unsophisticated brute-force, not a hard DoS guarantee, for this demo scope.
 */
const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  { max, windowMs }: RateLimitConfig,
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { allowed: true }
}

/** Test-only: reset shared state between test cases. */
export function resetRateLimitStore() {
  buckets.clear()
}
