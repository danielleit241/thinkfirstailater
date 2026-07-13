import type { Metadata } from "next"
import Link from "next/link"

import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getRewardSummary } from "@/server/rewards/queries"
import { listActiveVouchers } from "@/server/vouchers/queries"

import { VoucherRedeemButton } from "./voucher-redeem-button"

export const metadata: Metadata = {
  title: "Đổi voucher",
}

export default async function VouchersPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)

  const [vouchers, reward] = await Promise.all([
    listActiveVouchers(),
    getRewardSummary(user.id),
  ])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Đổi voucher
        </h1>
        <p className="mt-2 text-white/60">
          Dùng lúa đã tích luỹ để đổi voucher trình diễn (demo) — đây không phải
          mã giảm giá thật, chỉ dùng để minh hoạ tính năng.
        </p>
        <p className="mt-4 text-sm text-white/60">
          Số lúa hiện có:{" "}
          <span className="font-semibold text-[var(--insight-orange)]">
            {reward.balance}
          </span>
        </p>
      </div>

      {vouchers.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
          Hiện chưa có voucher nào đang mở.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => {
            const canAfford = reward.balance >= voucher.riceCost

            return (
              <div
                key={voucher.slug}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div>
                  <p className="text-sm text-white/50">{voucher.brand}</p>
                  <h2 className="text-lg font-bold">{voucher.title}</h2>
                  <p className="mt-1 text-sm text-white/60">
                    {voucher.description}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white/80">
                  {voucher.riceCost} lúa
                </p>
                <VoucherRedeemButton
                  voucherSlug={voucher.slug}
                  canAfford={canAfford}
                />
              </div>
            )
          })}
        </div>
      )}

      <Link
        href="/vouchers/history"
        className="w-fit rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
      >
        Xem lịch sử đổi voucher
      </Link>
    </div>
  )
}
