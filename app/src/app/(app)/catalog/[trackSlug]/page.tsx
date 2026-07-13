import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"

import { requireSessionForPage } from "@/server/auth/page-guards"
import {
  getTrackDetail,
  getUserActivityCompletions,
} from "@/server/learning/queries"

const activityTypeLabel: Record<string, string> = {
  LESSON: "Đọc tham khảo",
  QUIZ: "Quiz",
  CHECKLIST: "Checklist",
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>
}) {
  const session = await requireSessionForPage()
  const { trackSlug } = await params
  const track = await getTrackDetail(trackSlug)

  if (!track) notFound()

  const activities = track.modules.flatMap(
    (trackModule) => trackModule.activities,
  )
  const actionableIds = activities
    .filter((activity) => activity.type !== "LESSON")
    .map((activity) => activity.id)
  const completedActivityIds = await getUserActivityCompletions(
    session.user.id,
    actionableIds,
  )
  const completedCount = actionableIds.filter((id) =>
    completedActivityIds.has(id),
  ).length
  const progress = actionableIds.length
    ? Math.round((completedCount / actionableIds.length) * 100)
    : 0
  const recommendedActivity =
    completedCount === 0
      ? activities[0]
      : activities.find(
          (activity) =>
            activity.type !== "LESSON" &&
            !completedActivityIds.has(activity.id),
        )

  return (
    <div className="grid gap-8">
      <header className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
        <div className="max-w-3xl">
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--horizon)]"
          >
            ← Toàn bộ lộ trình
          </Link>
          <p className="mt-5 text-xs font-bold tracking-[0.12em] text-[var(--horizon)] uppercase">
            Chủ đề thực hành
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            {track.title}
          </h1>
          <p className="mt-4 leading-7 text-[var(--ink-muted)]">
            {track.description}
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-[var(--ink-muted)]">
            <span className="text-[var(--sunrise-ink)]">Đầu ra:</span>
            {track.skillOutcome}
          </p>
        </div>
        <aside className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="utility-label text-[var(--horizon)]">TIẾN ĐỘ</p>
              <p className="mt-2 text-3xl font-bold">{progress}%</p>
            </div>
            <span className="text-sm text-[var(--ink-muted)]">
              {completedCount}/{actionableIds.length} thực hành
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--line)]"
            role="progressbar"
            aria-label={`Đã hoàn thành ${progress}% chủ đề`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-[var(--horizon)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {recommendedActivity ? (
            <Link
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--horizon)] px-4 text-sm font-bold text-white hover:bg-[var(--horizon-deep)]"
              href={`/catalog/${track.slug}/${recommendedActivity.slug}`}
            >
              {completedCount ? "Tiếp tục chủ đề" : "Bắt đầu chủ đề"}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : null}
        </aside>
      </header>

      {track.modules.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-bold">Chủ đề này chưa có nội dung</h2>
          <Link
            className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[var(--leaf)]"
            href="/catalog"
          >
            Chọn chủ đề khác
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {track.modules.map((trackModule) => (
            <section
              key={trackModule.id}
              className="rounded-2xl border border-[var(--line)] bg-white p-5 md:p-7"
            >
              <p className="utility-label text-[var(--sunrise-ink)]">
                PHẦN THỰC HÀNH
              </p>
              <h2 className="mt-2 text-xl font-bold">{trackModule.title}</h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {trackModule.description}
              </p>

              {trackModule.activities.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--ink-soft)]">
                  Phần này chưa có hoạt động.
                </p>
              ) : (
                <ol className="mt-6 divide-y divide-[var(--line)]">
                  {trackModule.activities.map((activity, index) => {
                    const isLesson = activity.type === "LESSON"
                    const completed =
                      !isLesson && completedActivityIds.has(activity.id)
                    const status = isLesson
                      ? "Tham khảo"
                      : completed
                        ? "Đã xong"
                        : "Chưa làm"

                    return (
                      <li key={activity.id}>
                        <Link
                          href={`/catalog/${track.slug}/${activity.slug}`}
                          className="group grid min-h-20 grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-3 hover:text-[var(--leaf)]"
                          aria-describedby={`activity-${activity.id}-status`}
                        >
                          <span
                            className={`grid h-9 w-9 place-items-center rounded-[50%_50%_50%_10px] border text-xs font-bold ${completed ? "border-[var(--seedling)] bg-[var(--seedling-soft)] text-[var(--leaf)]" : "border-[var(--line)] text-[var(--ink-soft)]"}`}
                          >
                            {completed ? (
                              <Check
                                size={15}
                                strokeWidth={3}
                                aria-hidden="true"
                              />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <span>
                            <small className="block text-xs font-semibold text-[var(--ink-soft)]">
                              {activityTypeLabel[activity.type]}
                            </small>
                            <strong className="mt-1 block text-sm text-[var(--ink)] group-hover:text-[var(--leaf)]">
                              {activity.title}
                            </strong>
                          </span>
                          <span
                            id={`activity-${activity.id}-status`}
                            className={`sr-only rounded-full px-3 py-1 text-xs font-semibold sm:not-sr-only ${completed ? "text-[var(--ink-muted)]" : isLesson ? "bg-[var(--mist)] text-[var(--ink-muted)]" : "bg-[var(--seedling-soft)] text-[var(--leaf)]"}`}
                          >
                            {status}
                          </span>
                          <ArrowRight
                            className="sm:hidden"
                            size={17}
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
