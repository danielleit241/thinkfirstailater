import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpenCheck, Clock3, Target } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { requireSessionForPage } from "@/server/auth/page-guards"
import {
  getUserLearningOverview,
  listActiveTracks,
} from "@/server/learning/queries"

export const metadata: Metadata = {
  title: "Lộ trình",
}

export default async function CatalogPage() {
  const session = await requireSessionForPage()
  const [tracks, overview] = await Promise.all([
    listActiveTracks(),
    getUserLearningOverview(session.user.id),
  ])
  const progress = overview.totalActionable
    ? Math.round(
        (overview.completedActionable / overview.totalActionable) * 100,
      )
    : 0

  return (
    <div className="grid gap-10">
      <header className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-[var(--horizon)]">
            Lộ trình năng lực AI
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            Học theo một đường đi, không gom nhặt prompt rời rạc.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--ink-muted)]">
            Ba chủ đề đi từ đặt câu hỏi, kiểm chứng lập luận đến cộng tác có
            trách nhiệm. Mỗi chủ đề chia thành các nhóm bài ngắn, xen bài đọc
            và hoạt động để bạn tự kiểm tra điều vừa học.
          </p>
        </div>

        <aside className="rounded-2xl bg-[var(--midnight)] p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="utility-label text-[var(--electric)]">TIẾN ĐỘ</p>
              <p className="mt-2 text-3xl font-bold">{progress}%</p>
            </div>
            <span className="text-sm text-white/75">
              {overview.completedActionable}/{overview.totalActionable} hoạt
              động
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label={`Đã hoàn thành ${progress}% lộ trình`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-[var(--sunrise-ink)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </aside>
      </header>

      {overview.nextActivity ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--horizon)] uppercase">
              Nên làm tiếp
            </p>
            <h2 className="mt-1 text-lg font-bold">
              {overview.nextActivity.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {overview.nextActivity.trackTitle}
            </p>
          </div>
          <Link className={buttonVariants()} href={overview.nextActivity.href}>
            Tiếp tục học <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {tracks.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-bold">Chưa có chủ đề đang mở</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Quay lại sau khi nội dung mới được xuất bản.
          </p>
        </div>
      ) : (
        <ol className="relative grid gap-5 before:absolute before:top-10 before:bottom-10 before:left-6 before:w-px before:bg-[var(--line)] md:before:left-8">
          {tracks.map((track, index) => (
            <li
              key={track.id}
              className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-4 md:grid-cols-[4rem_minmax(0,1fr)]"
            >
              <span className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--cloud)] font-[family-name:var(--font-utility)] text-sm font-bold text-[var(--horizon)] md:h-16 md:w-16">
                0{index + 1}
              </span>
              <Link
                href={`/catalog/${track.slug}`}
                className="group grid gap-6 rounded-2xl border border-[var(--line)] bg-white p-6 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-[var(--horizon)] lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center"
              >
                <div>
                  <p className="utility-label text-[var(--sunrise-ink)]">
                    CHỦ ĐỀ {index + 1} / {tracks.length}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] md:text-3xl">
                    {track.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
                    {track.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--ink-soft)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={15} aria-hidden="true" /> Khoảng{" "}
                      {track.estimatedMinutes} phút
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpenCheck size={15} aria-hidden="true" />{" "}
                      {track.lessonCount} bài đọc · {track.actionableCount} thực
                      hành
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--seedling-soft)] p-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-[var(--horizon)] uppercase">
                    <Target size={16} aria-hidden="true" /> Bạn sẽ làm được
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                    {track.skillOutcome}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--horizon)]">
                    Mở chủ đề <ArrowRight size={17} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
