import type { Metadata } from "next"

import {
  getRewardConfigForAdmin,
  listAllTracksForAdmin,
  listAllVouchersForAdmin,
} from "@/server/admin/queries"

import { ContentStatusRow } from "./content-status-row"
import { RewardConfigForm } from "./reward-config-form"
import { VoucherStatusRow } from "./voucher-status-row"

export const metadata: Metadata = {
  title: "Quản trị",
}

export default async function AdminPage() {
  const [rewardConfig, vouchers, tracks] = await Promise.all([
    getRewardConfigForAdmin(),
    listAllVouchersForAdmin(),
    listAllTracksForAdmin(),
  ])

  return (
    <div className="grid gap-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Khu vực quản trị
        </h1>
        <p className="mt-2 text-white/60">
          Chỉ tài khoản có vai trò ADMIN mới truy cập được trang này (kiểm tra ở
          server, không chỉ ở giao diện). Mọi thay đổi bên dưới chỉ áp dụng cho
          lượt tiếp theo — lịch sử lúa/voucher đã ghi không bị đổi.
        </p>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">Lúa thưởng hàng ngày</h2>
        {rewardConfig ? (
          <RewardConfigForm initialAmount={rewardConfig.dailyRewardAmount} />
        ) : (
          <p className="text-sm text-red-400">
            Chưa có cấu hình thưởng — cần chạy seed trước.
          </p>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">Voucher</h2>
        {vouchers.length === 0 ? (
          <p className="text-sm text-white/60">Chưa có voucher nào.</p>
        ) : (
          <div className="grid gap-2">
            {vouchers.map((voucher) => (
              <VoucherStatusRow
                key={voucher.id}
                voucherId={voucher.id}
                brand={voucher.brand}
                title={voucher.title}
                initialRiceCost={voucher.riceCost}
                initialActive={voucher.active}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">
          Nội dung học (track / module / activity)
        </h2>
        {tracks.length === 0 ? (
          <p className="text-sm text-white/60">Chưa có nội dung nào.</p>
        ) : (
          tracks.map((track) => (
            <div key={track.id} className="grid gap-2">
              <ContentStatusRow
                kind="track"
                id={track.id}
                title={`Track: ${track.title}`}
                initialActive={track.active}
                initialSortOrder={track.sortOrder}
              />
              <div className="ml-4 grid gap-2">
                {track.modules.map((module) => (
                  <div key={module.id} className="grid gap-2">
                    <ContentStatusRow
                      kind="module"
                      id={module.id}
                      title={`Module: ${module.title}`}
                      initialActive={module.active}
                      initialSortOrder={module.sortOrder}
                    />
                    <div className="ml-4 grid gap-2">
                      {module.activities.map((activity) => (
                        <ContentStatusRow
                          key={activity.id}
                          kind="activity"
                          id={activity.id}
                          title={`Activity: ${activity.title}`}
                          initialActive={activity.active}
                          initialSortOrder={activity.sortOrder}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
