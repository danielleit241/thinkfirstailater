import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side session check for this whole authenticated area — the route
  // group name is not what protects this layout, this call is.
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)

  return (
    <div className="min-h-screen bg-[var(--midnight)] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-white/80"
        >
          THINK FIRST{" "}
          <span className="text-[var(--insight-orange)]">/ AI LATER</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">Xin chào, {user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="page-width py-12">{children}</main>
    </div>
  )
}
