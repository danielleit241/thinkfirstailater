import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { requireRoleForPage } from "@/server/auth/page-guards"

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side role check for the whole admin area — every ADMIN-only
  // action/service under this tree must also call `requireRole` itself, this
  // layout check alone is not sufficient authorization for mutations.
  await requireRoleForPage("ADMIN")

  return (
    <div className="min-h-screen bg-[var(--midnight)] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link
          href="/dashboard"
          className="text-sm font-bold tracking-wide text-white/80"
        >
          THINK FIRST{" "}
          <span className="text-[var(--insight-orange)]">/ ADMIN</span>
        </Link>
        <LogoutButton />
      </header>
      <main className="page-width py-12">{children}</main>
    </div>
  )
}
