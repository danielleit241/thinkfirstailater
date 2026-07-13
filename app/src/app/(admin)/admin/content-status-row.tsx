"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateActivityStatusAction,
  updateModuleStatusAction,
  updateTrackStatusAction,
} from "@/server/admin/actions"

type ContentKind = "track" | "module" | "activity"

const ACTION_BY_KIND: Record<
  ContentKind,
  (
    id: string,
    input: { active?: boolean; sortOrder?: number },
  ) => Promise<unknown>
> = {
  track: updateTrackStatusAction,
  module: updateModuleStatusAction,
  activity: updateActivityStatusAction,
}

export function ContentStatusRow({
  kind,
  id,
  title,
  initialActive,
  initialSortOrder,
}: {
  kind: ContentKind
  id: string
  title: string
  initialActive: boolean
  initialSortOrder: number
}) {
  const [active, setActive] = useState(initialActive)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await ACTION_BY_KIND[kind](id, { active, sortOrder })
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <span className="flex-1 text-sm font-semibold">{title}</span>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Hiện
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        Thứ tự
        <Input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
          className="w-16"
        />
      </label>
      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
