import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"
import { auth } from "@/server/auth"
import { requireSession, UnauthorizedError } from "@/server/auth/guards"
import { prisma } from "@/server/db"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// extends the Phase 2 spike (auth.integration.test.ts, left untouched) with
// the explicit success/error cases the auth vertical slice must cover.
describe("auth flows: register / login / session / logout", () => {
  const password = "correct-horse-battery-staple"
  const emailsToCleanUp: string[] = []

  afterAll(async () => {
    if (emailsToCleanUp.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: emailsToCleanUp } },
      })
    }
    await prisma.$disconnect()
  })

  function freshEmail(prefix: string) {
    const email = `${prefix}-${randomUUID()}@example.com`
    emailsToCleanUp.push(email)
    return email
  }

  it("registers successfully and stores a hashed password, not plaintext", async () => {
    const email = freshEmail("register-success")

    const { user } = await auth.api.signUpEmail({
      body: { name: "New User", email, password },
    })

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(dbUser.email).toBe(email)
    expect(dbUser.role).toBe("USER")

    const account = await prisma.account.findFirstOrThrow({
      where: { userId: user.id, providerId: "credential" },
    })
    expect(account.password).toBeTruthy()
    expect(account.password).not.toBe(password)
  })

  it("rejects registration with a duplicate email", async () => {
    const email = freshEmail("register-duplicate")
    await auth.api.signUpEmail({ body: { name: "First", email, password } })

    await expect(
      auth.api.signUpEmail({ body: { name: "Second", email, password } }),
    ).rejects.toBeTruthy()

    const count = await prisma.user.count({ where: { email } })
    expect(count).toBe(1)
  })

  it("rejects login with the wrong password", async () => {
    const email = freshEmail("login-wrong-password")
    await auth.api.signUpEmail({ body: { name: "Someone", email, password } })

    await expect(
      auth.api.signInEmail({
        body: { email, password: "totally-wrong-password" },
      }),
    ).rejects.toBeTruthy()
  })

  it("blocks an anonymous caller from a session-protected action", async () => {
    await expect(requireSession(new Headers())).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it("keeps the session valid across a simulated refresh and a fresh login", async () => {
    const email = freshEmail("session-persistence")
    await auth.api.signUpEmail({
      body: { name: "Persistent User", email, password },
    })

    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const cookie = signInResponse.headers.get("set-cookie")!.split(";")[0]
    const headers = new Headers({ cookie })

    // Simulated "refresh": re-read the session with the same cookie.
    const sessionAfterRefresh = await requireSession(headers)
    expect(sessionAfterRefresh.user.email).toBe(email)

    // Logging in again (e.g. a new browser tab) must resolve to the same
    // identity, not a different user.
    const secondSignInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const secondCookie = secondSignInResponse.headers
      .get("set-cookie")!
      .split(";")[0]
    const secondHeaders = new Headers({ cookie: secondCookie })
    const secondSession = await requireSession(secondHeaders)
    expect(secondSession.user.id).toBe(sessionAfterRefresh.user.id)
  })

  it("invalidates the session on logout so it cannot be reused", async () => {
    const email = freshEmail("logout-invalidation")
    await auth.api.signUpEmail({
      body: { name: "Logout User", email, password },
    })

    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const cookie = signInResponse.headers.get("set-cookie")!.split(";")[0]
    const headers = new Headers({ cookie })

    // Session works before logout.
    await expect(requireSession(headers)).resolves.toBeTruthy()

    await auth.api.signOut({ headers })

    // Same (now-invalidated) cookie must no longer resolve to a session.
    await expect(requireSession(headers)).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })
})
