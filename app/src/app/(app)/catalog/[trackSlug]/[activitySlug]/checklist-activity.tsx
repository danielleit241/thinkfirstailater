"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { LearningJourney } from "@/components/learning-journey"
import { Button, buttonVariants } from "@/components/ui/button"
import { submitChecklistProgress } from "@/server/learning/actions"

type ChecklistItem = { id: string; label: string; detail: string }
type ChecklistResult = Awaited<ReturnType<typeof submitChecklistProgress>>

export function ChecklistActivity({
  activityId,
  items,
  initialCompleted,
  nextHref,
}: {
  activityId: string
  items: ChecklistItem[]
  initialCompleted: boolean
  nextHref: string | null
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    initialCompleted
      ? Object.fromEntries(items.map((item) => [item.id, true]))
      : {},
  )
  const [result, setResult] = useState<ChecklistResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const completed = initialCompleted || result?.completed === true

  function toggle(id: string) {
    if (completed) return
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
        const submitted = await submitChecklistProgress(
          activityId,
          checkedItemIds,
        )
        setResult(submitted)
        if (!submitted.completed) {
          setError("Hãy tự đánh giá đủ tất cả mục trước khi xác nhận.")
        }
      } catch {
        setError("Không thể ghi nhận. Hãy thử lại.")
      }
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4 text-sm">
        <h2 className="font-bold">Tự kiểm trước khi dùng kết quả</h2>
        <span className="font-[family-name:var(--font-utility)] text-[var(--ink-soft)]">
          {completedCount}/{items.length}
        </span>
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => toggle(item.id)}
          disabled={completed}
          aria-pressed={Boolean(checked[item.id])}
          className="flex min-h-16 items-start gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-left hover:border-[var(--seedling)]"
        >
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[50%_50%_50%_7px] border ${checked[item.id] ? "border-[var(--leaf)] bg-[var(--leaf)] text-[var(--paper)]" : "border-[var(--line)]"}`}
          >
            {checked[item.id] ? (
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            ) : null}
          </span>
          <span>
            <span className="block font-semibold">{item.label}</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--ink-muted)]">
              {item.detail}
            </span>
          </span>
        </button>
      ))}

      {completed ? (
        <section
          className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5"
          aria-live="polite"
        >
          <p className="text-sm font-bold text-[var(--leaf)]">
            {result?.reward?.dailyRewardGranted
              ? `Đã hoàn thành và nhận lúa · Số dư ${result.reward.balance}`
              : result?.reward
                ? "Tiến độ đã lưu · Lúa hôm nay đã nhận trước đó"
                : "Tiến độ của hoạt động này đã được lưu"}
          </p>
          <LearningJourney activeStep={2} />
          <Link className={buttonVariants()} href={nextHref ?? "/vouchers"}>
            {nextHref ? "Tiếp tục hoạt động" : "Xem quà đổi được"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
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

      {error && !completed ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  )
}
