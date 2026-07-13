import { headers as nextHeaders } from "next/headers"
import { redirect } from "next/navigation"

import type { Role } from "@/generated/prisma/enums"

import {
  ForbiddenError,
  requireRole,
  requireSession,
  UnauthorizedError,
} from "./guards"

/**
 * Server Component helper for authenticated-only layouts/pages. Reads the
 * request headers via `next/headers` (only valid inside a Next.js request
 * scope) and redirects to `/login` when there is no session. This is a thin
 * wrapper around `requireSession` — the actual authorization check lives
 * there so it stays unit-testable outside of Next.js request context.
 */
export async function requireSessionForPage() {
  try {
    return await requireSession(await nextHeaders())
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login")
    }
    throw error
  }
}

/**
 * Server Component helper for role-gated layouts/pages (e.g. admin shell).
 * Unauthenticated visitors are sent to `/login`; authenticated visitors with
 * the wrong role are sent back to the authenticated dashboard instead of a
 * page that reveals the admin area exists.
 */
export async function requireRoleForPage(role: Role) {
  try {
    return await requireRole(await nextHeaders(), role)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login")
    }
    if (error instanceof ForbiddenError) {
      redirect("/dashboard")
    }
    throw error
  }
}
