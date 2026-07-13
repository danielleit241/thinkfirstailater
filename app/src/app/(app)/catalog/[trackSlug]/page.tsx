import Link from "next/link"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"

import { requireSessionForPage } from "@/server/auth/page-guards"
import {
  getTrackDetail,
  getUserActivityCompletions,
} from "@/server/learning/queries"

const activityTypeLabel: Record<string, string> = {
  LESSON: "Bài học",
  QUIZ: "Câu hỏi",
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

  if (!track) {
    notFound()
  }

  const activityIds = track.modules.flatMap((trackModule) =>
    trackModule.activities.map((activity) => activity.id),
  )
  const completedActivityIds = await getUserActivityCompletions(
    session.user.id,
    activityIds,
  )
  const completedCount = activityIds.filter((id) =>
    completedActivityIds.has(id),
  ).length

  return (
    <div className="grid gap-8">
      <div>
        <Link
          href="/catalog"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Tất cả lộ trình
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
          {track.title}
        </h1>
        <p className="mt-2 text-white/60">{track.description}</p>
        {activityIds.length > 0 ? (
          <p className="mt-2 text-sm text-white/50">
            {completedCount}/{activityIds.length} hoạt động đã hoàn thành
          </p>
        ) : null}
      </div>

      {track.modules.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
          Chủ đề này chưa có nội dung.
        </p>
      ) : (
        <div className="grid gap-6">
          {track.modules.map((trackModule) => (
            <section
              key={trackModule.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-xl font-bold">{trackModule.title}</h2>
              <p className="mt-1 text-sm text-white/60">
                {trackModule.description}
              </p>

              {trackModule.activities.length === 0 ? (
                <p className="mt-4 text-sm text-white/40">
                  Chưa có hoạt động nào trong module này.
                </p>
              ) : (
                <ul className="mt-4 grid gap-2">
                  {trackModule.activities.map((activity) => (
                    <li key={activity.id}>
                      <Link
                        href={`/catalog/${track.slug}/${activity.slug}`}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/30 hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          {completedActivityIds.has(activity.id) ? (
                            <Check
                              size={14}
                              strokeWidth={3}
                              className="text-[var(--insight-orange)]"
                            />
                          ) : null}
                          {activity.title}
                        </span>
                        <span className="text-xs font-bold tracking-wide text-white/50 uppercase">
                          {activityTypeLabel[activity.type]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
