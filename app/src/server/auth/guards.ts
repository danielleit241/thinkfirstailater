import type { Role } from "@/generated/prisma/enums"
import { auth } from "@/server/auth"

/**
 * Thrown when a caller has no valid session at all. Server Components
 * translate this into a redirect to `/login`; Server Actions/services can
 * catch it and return a generic error to the UI.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Bạn cần đăng nhập để tiếp tục.") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

/**
 * Thrown when a caller has a valid session but the wrong role for the
 * requested action (e.g. USER calling an ADMIN-only service/action).
 */
export class ForbiddenError extends Error {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super(message)
    this.name = "ForbiddenError"
  }
}

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

/** Fields safe to expose to the UI — never include password/token/session data. */
export type SafeUser = {
  id: string
  name: string
  email: string
  role: Role
  image: string | null
}

export function toSafeUser(user: Session["user"]): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user as { role: Role }).role,
    image: user.image ?? null,
  }
}

/**
 * Require an authenticated session. Callers pass the request `Headers`
 * (from `next/headers` in a Server Component/Action, or a constructed
 * `Headers` in tests/services) — the session is always re-read from the DB
 * via Better Auth, never trusted from client-supplied fields.
 *
 * This is the helper every protected Server Action/Server Component MUST
 * call directly — a route group name is not authorization.
 */
export async function requireSession(headers: Headers): Promise<Session> {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw new UnauthorizedError()
  }

  return session
}

/**
 * Require an authenticated session AND a specific role. Role is read from
 * the DB-backed session (`user.role`), never from client input.
 */
export async function requireRole(
  headers: Headers,
  role: Role,
): Promise<Session> {
  const session = await requireSession(headers)

  if (session.user.role !== role) {
    throw new ForbiddenError()
  }

  return session
}
