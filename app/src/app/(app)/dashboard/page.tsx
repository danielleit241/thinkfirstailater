import type { Metadata } from "next"
import Link from "next/link"

import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getRewardSummary } from "@/server/rewards/queries"

export const metadata: Metadata = {
  title: "Bảng điều khiển",
}

export default async function DashboardPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)
  const reward = await getRewardSummary(user.id)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Chào mừng trở lại, {user.name}
        </h1>
        <p className="mt-2 text-white/60">
          Vai trò hiện tại của bạn:{" "}
          <span className="font-semibold">{user.role}</span>
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-white/60">Số lúa hiện có</p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--insight-orange)]">
            {reward.balance}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/60">Streak hiện tại</p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {reward.currentStreak} ngày
          </p>
        </div>
      </div>

      {reward.history.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="mb-3 text-sm font-semibold text-white/80">
            Lịch sử thưởng gần đây
          </p>
          <ul className="grid gap-2 text-sm text-white/70">
            {reward.history.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.businessDate}</span>
                <span>
                  +{item.amount} lúa · streak {item.streakCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/catalog"
          className="w-fit rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Vào lộ trình học
        </Link>
        <Link
          href="/vouchers"
          className="w-fit rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Đổi voucher
        </Link>
      </div>

      {user.role === "ADMIN" ? (
        <Link
          href="/admin"
          className="w-fit rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Đi tới khu vực quản trị
        </Link>
      ) : null}
    </div>
  )
}
