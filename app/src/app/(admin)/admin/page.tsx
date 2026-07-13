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
    <div className="grid gap-8">
      <header className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-[var(--signal)]">
          Vận hành bản demo
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">
          Khu vực quản trị
        </h1>
        <p className="mt-4 leading-7 text-[var(--ink-muted)]">
          Điều chỉnh phần thưởng, quà và nội dung đang mở. Thay đổi mới chỉ áp
          dụng cho các lượt tiếp theo; lịch sử người học được giữ nguyên.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="text-lg font-bold">Lúa thưởng hàng ngày</h2>
        {rewardConfig ? (
          <RewardConfigForm initialAmount={rewardConfig.dailyRewardAmount} />
        ) : (
          <p className="text-sm text-red-800">
            Chưa có cấu hình thưởng. Hãy chạy dữ liệu khởi tạo trước.
          </p>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="text-lg font-bold">Quà đang mở</h2>
        {vouchers.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">Chưa có quà nào.</p>
        ) : (
          <div className="grid gap-2">
            {vouchers.map((voucher) => (
              <VoucherStatusRow
                key={voucher.id}
                voucherId={voucher.id}
                brand={voucher.brand}
                title={voucher.title}
                imageUrl={voucher.imageUrl}
                initialRiceCost={voucher.riceCost}
                initialActive={voucher.active}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <div>
          <h2 className="text-lg font-bold">Trạng thái nội dung học</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Mở từng lộ trình và nhóm bài để chỉnh phần nội dung cần thiết.
          </p>
        </div>
        {tracks.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Chưa có nội dung nào.
          </p>
        ) : (
          <div className="grid gap-3">
            {tracks.map((track, trackIndex) => (
              <details
                key={track.id}
                open={trackIndex === 0}
                className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--mist)]"
              >
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 bg-white px-4 py-3 font-semibold marker:text-[var(--horizon)]">
                  <span>{track.title}</span>
                  <span className="text-xs font-normal text-[var(--ink-soft)]">
                    {track.modules.length} nhóm bài
                  </span>
                </summary>
                <div className="grid gap-3 border-t border-[var(--line)] p-3">
                  <ContentStatusRow
                    kind="track"
                    id={track.id}
                    title={`Lộ trình: ${track.title}`}
                    initialActive={track.active}
                    initialSortOrder={track.sortOrder}
                  />
                  {track.modules.map((module) => (
                    <details
                      key={module.id}
                      className="overflow-hidden rounded-xl border border-[var(--line)] bg-white"
                    >
                      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-semibold marker:text-[var(--horizon)]">
                        <span>{module.title}</span>
                        <span className="text-xs font-normal text-[var(--ink-soft)]">
                          {module.activities.length} hoạt động
                        </span>
                      </summary>
                      <div className="grid gap-2 border-t border-[var(--line)] bg-[var(--mist)] p-3">
                        <ContentStatusRow
                          kind="module"
                          id={module.id}
                          title={`Nhóm bài: ${module.title}`}
                          initialActive={module.active}
                          initialSortOrder={module.sortOrder}
                        />
                        {module.activities.map((activity) => (
                          <ContentStatusRow
                            key={activity.id}
                            kind="activity"
                            id={activity.id}
                            title={`Hoạt động: ${activity.title}`}
                            initialActive={activity.active}
                            initialSortOrder={activity.sortOrder}
                          />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
