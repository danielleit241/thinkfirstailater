import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkRateLimit, resetRateLimitStore } from "@/server/auth/rate-limit"

// Pure logic test for the bounded register/login mitigation used by
// `app/src/app/api/auth/[...all]/route.ts`. Named `*.integration.test.ts` to
// match this project's single Vitest entry point (`npm run test:integration`).
describe("checkRateLimit: bounded register/login mitigation", () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it("allows attempts up to the configured max within the window", () => {
    const key = "login:1.2.3.4"
    const config = { max: 3, windowMs: 60_000 }

    expect(checkRateLimit(key, config).allowed).toBe(true)
    expect(checkRateLimit(key, config).allowed).toBe(true)
    expect(checkRateLimit(key, config).allowed).toBe(true)
  })

  it("blocks the attempt once the max is exceeded within the window", () => {
    const key = "login:5.6.7.8"
    const config = { max: 2, windowMs: 60_000 }

    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it("resets the count once the window has elapsed", () => {
    vi.useFakeTimers()
    try {
      const key = "login:9.9.9.9"
      const config = { max: 1, windowMs: 1000 }

      expect(checkRateLimit(key, config).allowed).toBe(true)
      expect(checkRateLimit(key, config).allowed).toBe(false)

      vi.advanceTimersByTime(1001)

      expect(checkRateLimit(key, config).allowed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps independent counters per key", () => {
    const config = { max: 1, windowMs: 60_000 }

    expect(checkRateLimit("login:a", config).allowed).toBe(true)
    expect(checkRateLimit("login:b", config).allowed).toBe(true)
    expect(checkRateLimit("login:a", config).allowed).toBe(false)
  })
})
