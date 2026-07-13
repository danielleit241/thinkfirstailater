import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ReceiptText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getVoucherRedemptionHistory } from "@/server/vouchers/queries"

export const metadata: Metadata = {
  title: "Lịch sử đổi quà",
}

export default async function VoucherHistoryPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)
  const history = await getVoucherRedemptionHistory(user.id)

  return (
    <div className="grid gap-8">
      <header className="max-w-3xl">
        <Link
          href="/vouchers"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--leaf)]"
        >
          ← Quay lại đổi quà
        </Link>
        <p className="mt-5 text-sm font-semibold text-[var(--leaf)]">
          Lịch sử đổi quà
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] md:text-5xl">
          Những phần thưởng bạn đã đổi.
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-muted)]">
          Mỗi giao dịch giữ nguyên tên và mức lúa tại thời điểm bạn xác nhận.
        </p>
      </header>

      {history.length === 0 ? (
        <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <ReceiptText className="text-[var(--leaf)]" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-bold">Bạn chưa đổi quà nào</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            Hoàn thành một quiz hoặc checklist để nhận lúa đầu tiên, rồi quay
            lại chọn quà.
          </p>
          <Link className={`${buttonVariants()} mt-5`} href="/catalog">
            Đi tới lộ trình <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <ul className="grid gap-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <span>
                <small className="block font-semibold text-[var(--leaf)]">
                  {item.voucherBrandSnapshot}
                </small>
                <strong className="mt-1 block">
                  {item.voucherTitleSnapshot}
                </strong>
              </span>
              <span className="text-sm sm:text-right">
                <strong className="block text-[var(--sunrise-ink)]">
                  -{item.riceCostSnapshot} lúa
                </strong>
                <small className="mt-1 block text-[var(--ink-soft)]">
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Link className={buttonVariants()} href="/dashboard">
          Về tổng quan
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/catalog"
        >
          Tiếp tục học
        </Link>
      </div>
    </div>
  )
}
