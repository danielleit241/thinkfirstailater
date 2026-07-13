import type { Metadata } from "next"
import Link from "next/link"

import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getVoucherRedemptionHistory } from "@/server/vouchers/queries"

export const metadata: Metadata = {
  title: "Lịch sử đổi voucher",
}

export default async function VoucherHistoryPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)

  const history = await getVoucherRedemptionHistory(user.id)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Lịch sử đổi voucher
        </h1>
        <p className="mt-2 text-white/60">
          Danh sách này hiển thị giá/thông tin voucher tại đúng thời điểm bạn
          đổi — không đổi theo cấu hình voucher hiện hành sau này.
        </p>
      </div>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
          Bạn chưa đổi voucher nào.
        </p>
      ) : (
        <ul className="grid gap-2 text-sm text-white/70">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span>
                {item.voucherBrandSnapshot} — {item.voucherTitleSnapshot}
              </span>
              <span>
                -{item.riceCostSnapshot} lúa ·{" "}
                {new Date(item.createdAt).toLocaleString("vi-VN")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/vouchers"
        className="w-fit rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
      >
        Quay lại đổi voucher
      </Link>
    </div>
  )
}
