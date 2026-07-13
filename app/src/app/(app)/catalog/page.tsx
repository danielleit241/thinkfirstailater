import type { Metadata } from "next"
import Link from "next/link"

import { requireSessionForPage } from "@/server/auth/page-guards"
import { listActiveTracks } from "@/server/learning/queries"

export const metadata: Metadata = {
  title: "Lộ trình học",
}

export default async function CatalogPage() {
  await requireSessionForPage()

  const tracks = await listActiveTracks()

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Lộ trình học
        </h1>
        <p className="mt-2 text-white/60">
          Chọn một chủ đề để bắt đầu — mỗi chủ đề gồm bài học, câu hỏi kiểm tra
          và checklist tự đánh giá.
        </p>
      </div>

      {tracks.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
          Chưa có nội dung nào được xuất bản.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/catalog/${track.slug}`}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <h2 className="text-lg font-bold">{track.title}</h2>
              <p className="text-sm text-white/60">{track.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
