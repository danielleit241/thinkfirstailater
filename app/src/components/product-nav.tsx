"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/catalog", label: "Lộ trình" },
  { href: "/vouchers", label: "Đổi quà" },
]

export function ProductNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Khu vực học tập">
      <ul className="flex items-center justify-between gap-1 md:justify-start">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--seedling-soft)] hover:text-[var(--leaf)]",
                  active && "bg-[var(--seedling-soft)] text-[var(--leaf)]",
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
