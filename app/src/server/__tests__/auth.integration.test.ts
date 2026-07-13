import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"
import { auth } from "@/server/auth"
import { prisma } from "@/server/db"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// no mocking. Proves Better Auth DB session (register/login/read/delete)
// works against the pinned stack (Prisma 7 + @prisma/adapter-pg + Better Auth).
describe("better-auth spike: email/password + DB session", () => {
  const email = `spike-${randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"

  afterAll(async () => {
    // Deterministic cleanup: remove the test user (cascades to sessions/accounts).
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it("registers, logs in, reads the DB session, then signs out", async () => {
    const signUpResult = await auth.api.signUpEmail({
      body: { name: "Spike User", email, password },
    })

    expect(signUpResult.user.email).toBe(email)

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { email } })
    expect(dbUser.role).toBe("USER")

    // signUpEmail (autoSignIn) already creates one session; capture that as
    // the baseline so the sign-out assertion below only checks the session
    // created by the explicit sign-in below.
    const baselineSessionCount = await prisma.session.count({
      where: { userId: dbUser.id },
    })

    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })

    expect(signInResponse.status).toBe(200)
    const setCookie = signInResponse.headers.get("set-cookie")
    expect(setCookie).toBeTruthy()

    const sessionCookie = setCookie!.split(";")[0]
    const headers = new Headers({ cookie: sessionCookie })

    const session = await auth.api.getSession({ headers })
    expect(session?.user.email).toBe(email)
    expect(session?.session).toBeTruthy()

    const sessionCountBefore = await prisma.session.count({
      where: { userId: dbUser.id },
    })
    expect(sessionCountBefore).toBe(baselineSessionCount + 1)

    await auth.api.signOut({ headers })

    const sessionCountAfter = await prisma.session.count({
      where: { userId: dbUser.id },
    })
    expect(sessionCountAfter).toBe(baselineSessionCount)
  })
})
