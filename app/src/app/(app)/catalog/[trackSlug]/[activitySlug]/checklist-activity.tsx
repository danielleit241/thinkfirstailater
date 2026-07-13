"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { submitChecklistProgress } from "@/server/learning/actions"

type ChecklistItem = { id: string; label: string; detail: string }

export function ChecklistActivity({
  activityId,
  items,
  initialCompleted,
}: {
  activityId: string
  items: ChecklistItem[]
  initialCompleted: boolean
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    initialCompleted
      ? Object.fromEntries(items.map((item) => [item.id, true]))
      : {},
  )
  const [completed, setCompleted] = useState(initialCompleted)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setChecked((current) => ({ ...current, [id]: !current[id] }))
  }

  const completedCount = Object.values(checked).filter(Boolean).length

  function handleSubmit() {
    setError(null)
    const checkedItemIds = items
      .filter((item) => checked[item.id])
      .map((item) => item.id)

    startTransition(async () => {
      try {
        const result = await submitChecklistProgress(activityId, checkedItemIds)
        setCompleted(result.completed)
        if (!result.completed) {
          setError("Bạn cần tự đánh giá đủ tất cả mục để hoàn thành.")
        }
      } catch {
        setError("Không thể ghi nhận, vui lòng thử lại.")
      }
    })
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-white/50">
        {completedCount}/{items.length} mục đã tự đánh giá
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => toggle(item.id)}
          aria-pressed={Boolean(checked[item.id])}
          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-white/30"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30">
            {checked[item.id] ? <Check size={14} strokeWidth={3} /> : null}
          </span>
          <span>
            <span className="block font-semibold">{item.label}</span>
            <span className="block text-sm text-white/60">{item.detail}</span>
          </span>
        </button>
      ))}

      {completed ? (
        <p className="rounded-xl border border-[var(--insight-orange)]/40 p-4 text-sm font-semibold text-white">
          Bạn đã hoàn thành hoạt động này.
        </p>
      ) : (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-fit"
        >
          {isPending ? "Đang ghi nhận..." : "Xác nhận hoàn thành"}
        </Button>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
