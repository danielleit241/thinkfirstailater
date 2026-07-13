import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"
import { auth } from "@/server/auth"
import {
  ForbiddenError,
  requireRole,
  requireSession,
  toSafeUser,
} from "@/server/auth/guards"
import { prisma } from "@/server/db"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root).
// Exercises the authz helpers every protected Server Action/Server Component
// must call directly — anonymous callers and wrong-role callers must be
// rejected regardless of which route/route-group they came through.
describe("auth guards: requireSession / requireRole", () => {
  const userEmail = `guard-user-${randomUUID()}@example.com`
  const adminEmail = `guard-admin-${randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [userEmail, adminEmail] } },
    })
    await prisma.$disconnect()
  })

  async function signInAndGetHeaders(email: string) {
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const setCookie = signInResponse.headers.get("set-cookie")
    if (!setCookie) {
      throw new Error("Expected sign-in to set a session cookie")
    }
    return new Headers({ cookie: setCookie.split(";")[0] })
  }

  it("rejects an anonymous caller with no session", async () => {
    await expect(requireSession(new Headers())).rejects.toMatchObject({
      name: "UnauthorizedError",
    })
  })

  it("resolves the session and a safe user projection for an authenticated USER", async () => {
    await auth.api.signUpEmail({
      body: { name: "Guard User", email: userEmail, password },
    })
    const headers = await signInAndGetHeaders(userEmail)

    const session = await requireSession(headers)
    expect(session.user.email).toBe(userEmail)

    const safeUser = toSafeUser(session.user)
    expect(safeUser).toEqual({
      id: session.user.id,
      name: "Guard User",
      email: userEmail,
      role: "USER",
      image: null,
    })
    // Safe projection must never carry password/token/session fields.
    expect(safeUser).not.toHaveProperty("password")
  })

  it("forbids a USER session calling an ADMIN-only guard", async () => {
    const headers = await signInAndGetHeaders(userEmail)

    await expect(requireRole(headers, "ADMIN")).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })

  it("allows an ADMIN session through the ADMIN-only guard", async () => {
    const { user } = await auth.api.signUpEmail({
      body: { name: "Guard Admin", email: adminEmail, password },
    })
    // Role is only ever set server-side (Better Auth `input: false`); mirror
    // the same promotion path as `scripts/admin-bootstrap.ts`.
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    })

    const headers = await signInAndGetHeaders(adminEmail)

    const session = await requireRole(headers, "ADMIN")
    expect(session.user.role).toBe("ADMIN")
  })

  it("rejects a stale/anonymous-like header with no cookie for requireRole too", async () => {
    await expect(requireRole(new Headers(), "ADMIN")).rejects.toMatchObject({
      name: "UnauthorizedError",
    })
  })
})
