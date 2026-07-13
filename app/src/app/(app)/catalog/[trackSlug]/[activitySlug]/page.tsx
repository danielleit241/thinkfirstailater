import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, BookOpen, Lightbulb, Target } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { requireSessionForPage } from "@/server/auth/page-guards"
import {
  getActivityDetail,
  getTrackDetail,
  isActivityCompleted,
} from "@/server/learning/queries"

import { ChecklistActivity } from "./checklist-activity"
import { QuizActivity } from "./quiz-activity"

const typeLabel = {
  LESSON: "Bài đọc tham khảo",
  QUIZ: "Quiz kiểm chứng",
  CHECKLIST: "Checklist thực hành",
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ trackSlug: string; activitySlug: string }>
}) {
  const session = await requireSessionForPage()
  const { trackSlug, activitySlug } = await params
  const [activity, track] = await Promise.all([
    getActivityDetail(trackSlug, activitySlug),
    getTrackDetail(trackSlug),
  ])

  if (!activity || !track) notFound()

  const activities = track.modules.flatMap(
    (trackModule) => trackModule.activities,
  )
  const currentIndex = activities.findIndex((item) => item.id === activity.id)
  const nextActivity = currentIndex >= 0 ? activities[currentIndex + 1] : null
  const nextHref = nextActivity
    ? `/catalog/${trackSlug}/${nextActivity.slug}`
    : null
  const completed =
    activity.type === "LESSON"
      ? false
      : await isActivityCompleted(session.user.id, activity.id)

  return (
    <div className="grid gap-7">
      <header className="max-w-3xl">
        <Link
          href={`/catalog/${trackSlug}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--leaf)]"
        >
          ← {track.title}
        </Link>
        <p className="mt-5 text-xs font-bold tracking-[0.12em] text-[var(--horizon)] uppercase">
          Bước {currentIndex + 1}/{activities.length} ·{" "}
          {typeLabel[activity.type]}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
          {activity.title}
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          {activity.type === "LESSON"
            ? "Đọc chậm và ghi lại một điều bạn muốn thử trong công việc thật."
            : "Hoàn thành để lưu tiến độ và nhận lúa đầu tiên trong ngày."}
        </p>
      </header>

      <article className="rounded-2xl border border-[var(--line)] bg-white p-5 md:p-8">
        {activity.type === "LESSON" ? (
          <div className="grid gap-8">
            <div className="flex items-center gap-3 rounded-xl bg-[var(--seedling-soft)] p-4 text-sm font-semibold text-[var(--horizon)]">
              <BookOpen size={20} aria-hidden="true" />
              Bài đọc khoảng 2 phút · Không tính vào tiến độ hoàn thành
            </div>

            {activity.objective ? (
              <section className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--cloud)] p-5">
                <Target
                  className="mt-0.5 shrink-0 text-[var(--sunrise-ink)]"
                  size={22}
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-sm font-bold text-[var(--horizon)] uppercase">
                    Sau bài này, bạn có thể
                  </h2>
                  <p className="mt-2 leading-7 text-[var(--ink-muted)]">
                    {activity.objective}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="max-w-3xl">
              <h2 className="text-xl font-bold">Khung tư duy</h2>
              <p className="mt-3 leading-8 whitespace-pre-line text-[var(--ink-muted)]">
                {activity.body}
              </p>
            </section>

            {activity.example ? (
              <section aria-labelledby="example-title">
                <div className="flex items-center gap-2">
                  <Lightbulb
                    size={20}
                    className="text-[var(--sunrise-ink)]"
                    aria-hidden="true"
                  />
                  <h2 id="example-title" className="text-xl font-bold">
                    Xem sự khác biệt
                  </h2>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--cloud)] p-5">
                    <p className="utility-label text-[var(--ink-soft)]">
                      TRƯỚC KHI CÓ PHƯƠNG PHÁP
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                      {activity.example.before}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--electric)] bg-[var(--seedling-soft)] p-5">
                    <p className="utility-label text-[var(--horizon)]">
                      SAU KHI TỰ NGHĨ TRƯỚC
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                      {activity.example.after}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {activity.practice ? (
              <section className="rounded-2xl bg-[var(--midnight)] p-6 text-white md:p-7">
                <p className="utility-label text-[var(--electric)]">
                  ÁP DỤNG NGAY · 3 PHÚT
                </p>
                <h2 className="mt-3 text-xl font-bold">
                  {activity.practice.prompt}
                </h2>
                <ol className="mt-5 grid gap-3">
                  {activity.practice.steps.map((step, index) => (
                    <li
                      key={step}
                      className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-white/85"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 font-bold text-[var(--gold)]">
                        {index + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <aside className="rounded-xl border border-[var(--sunrise)] bg-[var(--harvest-soft)] p-4 text-sm leading-6 text-[var(--sunrise-ink)]">
              <strong className="block">Điều cần mang theo</strong>
              {activity.takeaway ??
                "Dừng lại và ghi một điều bạn sẽ áp dụng trước khi đi tiếp."}
            </aside>
            <Link
              className={`${buttonVariants()} w-fit`}
              href={nextHref ?? "/vouchers"}
            >
              {nextActivity ? "Tiếp tục hoạt động" : "Xem quà đổi được"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        {activity.type === "QUIZ" ? (
          <QuizActivity
            activityId={activity.id}
            question={activity.question}
            options={activity.options}
            initialCompleted={completed}
            nextHref={nextHref}
          />
        ) : null}

        {activity.type === "CHECKLIST" ? (
          <ChecklistActivity
            activityId={activity.id}
            items={activity.items}
            initialCompleted={completed}
            nextHref={nextHref}
          />
        ) : null}
      </article>
    </div>
  )
}
