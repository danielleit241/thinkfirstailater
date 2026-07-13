import type { Metadata } from "next"
import Link from "next/link"
import { History, Sprout } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getRewardSummary } from "@/server/rewards/queries"
import { listActiveVouchers } from "@/server/vouchers/queries"

import { VoucherRedeemButton } from "./voucher-redeem-button"

export const metadata: Metadata = {
  title: "Đổi quà",
}

export default async function VouchersPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)
  const [vouchers, reward] = await Promise.all([
    listActiveVouchers(),
    getRewardSummary(user.id),
  ])

  return (
    <div className="grid gap-8">
      <header className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-[var(--leaf)]">
            Đổi quà
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            Dùng lúa để khép lại một vòng học.
          </h1>
          <p className="mt-4 leading-7 text-[var(--ink-muted)]">
            Tất cả quà bên dưới chỉ dùng để trình diễn, không phải voucher hoặc
            mã giảm giá có giá trị thật.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--harvest-soft)] px-5 py-4 text-[var(--sunrise-ink)]">
          <Sprout aria-hidden="true" />
          <span>
            <small className="block text-xs font-semibold">Lúa hiện có</small>
            <strong className="text-2xl">{reward.balance}</strong>
          </span>
        </div>
      </header>

      {vouchers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-bold">Chưa có quà đang mở</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Bạn vẫn có thể tiếp tục học và tích lúa trong lúc chờ quà mới.
          </p>
          <Link className={`${buttonVariants()} mt-5`} href="/catalog">
            Tiếp tục học
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => {
            const missingRice = Math.max(voucher.riceCost - reward.balance, 0)
            const canAfford = missingRice === 0

            return (
              <article
                key={voucher.slug}
                className="flex min-h-72 flex-col rounded-2xl border border-[var(--line)] bg-white p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.08em] text-[var(--leaf)] uppercase">
                    {voucher.brand}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${canAfford ? "bg-[var(--seedling-soft)] text-[var(--leaf)]" : "bg-[var(--mist)] text-[var(--ink-muted)]"}`}
                  >
                    {canAfford ? "Đổi ngay" : `Cần thêm ${missingRice} lúa`}
                  </span>
                </div>
                <h2 className="mt-6 text-xl font-bold tracking-[-0.035em]">
                  {voucher.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                  {voucher.description}
                </p>
                <p className="mt-auto pt-6 text-lg font-bold text-[var(--sunrise-ink)]">
                  {voucher.riceCost} lúa
                </p>
                <VoucherRedeemButton
                  voucherSlug={voucher.slug}
                  voucherTitle={voucher.title}
                  riceCost={voucher.riceCost}
                  canAfford={canAfford}
                  missingRice={missingRice}
                />
              </article>
            )
          })}
        </div>
      )}

      <Link
        href="/vouchers/history"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-[var(--leaf)] underline-offset-4 hover:underline"
      >
        <History size={17} aria-hidden="true" /> Xem lịch sử đổi quà
      </Link>
    </div>
  )
}
