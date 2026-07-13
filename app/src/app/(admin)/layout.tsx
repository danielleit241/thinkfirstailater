import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { requireRoleForPage } from "@/server/auth/page-guards"

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRoleForPage("ADMIN")

  return (
    <div className="min-h-screen border-t-4 border-[var(--sunrise)] bg-[var(--cloud)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white shadow-[0_8px_8px_rgba(3,26,58,0.05)]">
        <div className="page-width flex min-h-18 flex-col items-stretch gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center text-sm font-bold"
          >
            Think First{" "}
            <span className="ml-1 text-[var(--sunrise-ink)]">/ Vận hành</span>
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--leaf)]"
            >
              Về khu học
            </Link>
            <LogoutButton className="min-h-11 px-3" variant="ghost" />
          </div>
        </div>
      </header>
      <main className="page-width py-8 md:py-12">{children}</main>
    </div>
  )
}
