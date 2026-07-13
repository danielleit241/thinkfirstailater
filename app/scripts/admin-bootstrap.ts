/**
 * One-time admin bootstrap: `npm run admin:bootstrap`.
 *
 * Reads admin credentials from env (never hard-coded), creates the first
 * ADMIN user via Better Auth (so the password is hashed the same way as any
 * other user), and is idempotent — running it again when an admin with the
 * same email already exists is a no-op.
 */
import { auth } from "../src/server/auth"
import { prisma } from "../src/server/db"

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

  if (!email || !password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be set to run admin:bootstrap",
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } })
      console.log(`Admin bootstrap: promoted existing user ${email} to ADMIN.`)
    } else {
      console.log(
        `Admin bootstrap: admin user ${email} already exists, nothing to do.`,
      )
    }
    return
  }

  const { user } = await auth.api.signUpEmail({
    body: { name: "Admin", email, password },
  })

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } })

  console.log(`Admin bootstrap: created ADMIN user ${email}.`)
}

main()
  .catch((error) => {
    console.error(
      "Admin bootstrap failed:",
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
