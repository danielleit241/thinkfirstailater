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
  const [savedActive, setSavedActive] = useState(initialActive)
  const [savedSortOrder, setSavedSortOrder] = useState(initialSortOrder)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isDirty = active !== savedActive || sortOrder !== savedSortOrder

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await ACTION_BY_KIND[kind](id, { active, sortOrder })
        setSavedActive(active)
        setSavedSortOrder(sortOrder)
        setSuccess(true)
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--mist)] p-3"
    >
      <span className="flex-1 text-sm font-semibold">{title}</span>
      <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--ink-muted)]">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => {
            setActive(event.target.checked)
            setSuccess(false)
          }}
        />
        Hiện
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--ink-muted)]">
        Thứ tự
        <Input
          type="number"
          min={0}
          required
          aria-label={`Thứ tự của ${title}`}
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(Number(event.target.value))
            setSuccess(false)
          }}
          className="w-16"
        />
      </label>
      <Button type="submit" disabled={isPending || !isDirty || sortOrder < 0}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {success ? (
        <p
          role="status"
          className="w-full text-sm font-semibold text-[var(--leaf)]"
        >
          Đã lưu {title}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </form>
  )
}
