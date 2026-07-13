import Link from "next/link"
import { notFound } from "next/navigation"

import { requireSessionForPage } from "@/server/auth/page-guards"
import {
  getActivityDetail,
  isActivityCompleted,
} from "@/server/learning/queries"

import { ChecklistActivity } from "./checklist-activity"
import { QuizActivity } from "./quiz-activity"

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ trackSlug: string; activitySlug: string }>
}) {
  const session = await requireSessionForPage()

  const { trackSlug, activitySlug } = await params
  const activity = await getActivityDetail(trackSlug, activitySlug)

  if (!activity) {
    notFound()
  }

  const completed =
    activity.type === "LESSON"
      ? false
      : await isActivityCompleted(session.user.id, activity.id)

  return (
    <div className="grid gap-6">
      <Link
        href={`/catalog/${trackSlug}`}
        className="text-sm text-white/50 hover:text-white"
      >
        ← Quay lại chủ đề
      </Link>

      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
        {activity.title}
      </h1>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {activity.type === "LESSON" ? (
          <p className="leading-relaxed whitespace-pre-line text-white/80">
            {activity.body}
          </p>
        ) : null}

        {activity.type === "QUIZ" ? (
          <QuizActivity
            activityId={activity.id}
            question={activity.question}
            options={activity.options}
            initialCompleted={completed}
          />
        ) : null}

        {activity.type === "CHECKLIST" ? (
          <ChecklistActivity
            activityId={activity.id}
            items={activity.items}
            initialCompleted={completed}
          />
        ) : null}
      </div>
    </div>
  )
}
