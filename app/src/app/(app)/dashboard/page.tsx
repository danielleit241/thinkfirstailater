import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Flame, Sprout } from "lucide-react"

import { LearningJourney } from "@/components/learning-journey"
import { buttonVariants } from "@/components/ui/button"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getUserLearningOverview } from "@/server/learning/queries"
import { getRewardSummary } from "@/server/rewards/queries"

export const metadata: Metadata = {
  title: "Tổng quan học tập",
}

export default async function DashboardPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)
  const [reward, learning] = await Promise.all([
    getRewardSummary(user.id),
    getUserLearningOverview(user.id),
  ])
  const progress = learning.totalActionable
    ? Math.round(
        (learning.completedActionable / learning.totalActionable) * 100,
      )
    : 0
  const journeyStep = reward.hasRedeemedVoucher
    ? 3
    : learning.completedActionable > 0
      ? 2
      : 0

  return (
    <div className="grid gap-8">
      <header className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-[var(--leaf)]">
          Tổng quan hôm nay
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.04em] md:text-5xl">
          Chào {user.name}, mình làm một việc cho rõ nhé.
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Tiến độ chỉ tính quiz và checklist có thể hoàn thành; bài đọc luôn ở
          đó để bạn tham khảo.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section
          className="rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8"
          aria-labelledby="next-task-title"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-[var(--seedling-soft)] px-3 py-1 text-xs font-bold text-[var(--leaf)]">
              Việc tiếp theo
            </span>
            <span className="font-[family-name:var(--font-utility)] text-sm text-[var(--ink-soft)]">
              {learning.completedActionable}/{learning.totalActionable}
            </span>
          </div>

          {learning.nextActivity ? (
            <>
              <p className="mt-7 text-sm font-semibold text-[var(--ink-soft)]">
                {learning.nextActivity.trackTitle} ·{" "}
                {learning.nextActivity.type === "QUIZ" ? "Quiz" : "Checklist"}
              </p>
              <h2
                id="next-task-title"
                className="mt-2 text-2xl font-bold tracking-[-0.035em] md:text-3xl"
              >
                {learning.nextActivity.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-muted)]">
                Hoàn thành hoạt động này để lưu tiến độ và nhận lúa đầu tiên
                trong ngày.
              </p>
              <Link
                className={`${buttonVariants()} mt-7`}
                href={learning.nextActivity.href}
              >
                Tiếp tục hoạt động <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <h2
                id="next-task-title"
                className="mt-7 text-2xl font-bold tracking-[-0.035em]"
              >
                Bạn đã hoàn tất mọi hoạt động có chấm điểm.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                Bạn vẫn có thể đọc lại bài học hoặc xem quà đang đổi được.
              </p>
              <Link className={`${buttonVariants()} mt-7`} href="/vouchers">
                Xem quà đổi được <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          )}

          <div
            className="mt-8 h-2 overflow-hidden rounded-full bg-[var(--line)]"
            aria-label={`Đã hoàn thành ${progress}%`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-[var(--leaf)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section
          className="rounded-2xl border border-[var(--line)] bg-white p-6"
          aria-labelledby="journey-title"
        >
          <p className="utility-label text-[var(--horizon)]">
            LỘ TRÌNH CỦA BẠN
          </p>
          <h2 id="journey-title" className="mt-3 text-xl font-bold">
            Từ học đến đổi quà
          </h2>
          <LearningJourney activeStep={journeyStep} />
        </section>
      </div>

      <section
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Thành quả học tập"
      >
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--harvest-soft)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--sunrise-ink)]">
                Lúa hiện có
              </p>
              <p className="mt-1 text-3xl font-bold text-[var(--sunrise-ink)]">
                {reward.balance}
              </p>
            </div>
            <Sprout className="text-[var(--harvest)]" aria-hidden="true" />
          </div>
          <Link
            className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--sunrise-ink)] underline-offset-4 hover:underline"
            href="/vouchers"
          >
            Xem quà đổi được
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-muted)]">
                Nhịp học hiện tại
              </p>
              <p className="mt-1 text-3xl font-bold">
                {reward.currentStreak} ngày
              </p>
            </div>
            <Flame className="text-[var(--leaf)]" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Một hoạt động đúng mỗi ngày là đủ để giữ nhịp.
          </p>
        </div>
      </section>

      {reward.history.length > 0 ? (
        <section
          className="rounded-2xl border border-[var(--line)] bg-white p-6"
          aria-labelledby="reward-history-title"
        >
          <h2 id="reward-history-title" className="text-base font-bold">
            Lúa nhận gần đây
          </h2>
          <ul className="mt-4 divide-y divide-[var(--line)] text-sm">
            {reward.history.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-[var(--ink-muted)]">
                  {item.businessDate}
                </span>
                <span className="font-semibold">
                  +{item.amount} lúa · streak {item.streakCount}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
