import { createAuthClient } from "better-auth/react"

// No `baseURL` needed: the client calls the Better Auth Route Handler
// (`/api/auth/[...all]`) mounted on the same origin.
export const authClient = createAuthClient()
