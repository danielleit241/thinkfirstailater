import Image from "next/image"
import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { ProductNav } from "@/components/product-nav"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)

  return (
    <div className="min-h-screen border-t-4 border-[var(--horizon)] bg-[var(--cloud)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white shadow-[0_8px_8px_rgba(3,26,58,0.05)]">
        <div className="page-width flex min-h-18 flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <Link
            className="brand mr-auto"
            href="/dashboard"
            aria-label="Về tổng quan"
          >
            <span className="brand-mark">
              <Image src="/icon.png" alt="" width={40} height={40} />
            </span>
            <span className="brand-copy">
              <strong>Think First</strong>
              <small>AI Later</small>
            </span>
          </Link>

          <div className="order-3 w-full border-t border-[var(--line)] pt-2 md:order-none md:w-auto md:border-0 md:pt-0">
            <ProductNav />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--ink-muted)] lg:inline">
              {user.name}
            </span>
            {user.role === "ADMIN" ? (
              <Link
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--signal)]"
                href="/admin"
              >
                Quản trị
              </Link>
            ) : null}
            <LogoutButton className="min-h-11 px-3" variant="ghost" />
          </div>
        </div>
      </header>
      <main className="page-width py-8 md:py-12">{children}</main>
    </div>
  )
}
