"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { LearningJourney } from "@/components/learning-journey"
import { Button, buttonVariants } from "@/components/ui/button"
import { submitQuizAnswer } from "@/server/learning/actions"

type Option = { id: string; text: string }
type QuizResult = Awaited<ReturnType<typeof submitQuizAnswer>>

export function QuizActivity({
  activityId,
  question,
  options,
  initialCompleted,
  nextHref,
}: {
  activityId: string
  question: string
  options: Option[]
  initialCompleted: boolean
  nextHref: string | null
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [completed, setCompleted] = useState(initialCompleted)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selectedOptionId) return

    setError(null)
    startTransition(async () => {
      try {
        const graded = await submitQuizAnswer(activityId, selectedOptionId)
        setResult(graded)
        setCompleted(graded.completed)
      } catch {
        setError("Không thể chấm câu trả lời. Hãy thử lại.")
      }
    })
  }

  function retry() {
    setSelectedOptionId(null)
    setResult(null)
  }

  return (
    <div className="grid gap-5">
      {completed && result === null ? (
        <p className="rounded-xl bg-[var(--seedling-soft)] p-4 text-sm font-semibold text-[var(--leaf)]">
          Hoạt động này đã hoàn thành. Bạn vẫn có thể làm lại để ôn tập.
        </p>
      ) : null}

      <h2 className="text-xl font-bold leading-7">{question}</h2>

      <fieldset className="grid gap-2" disabled={result !== null}>
        <legend className="sr-only">{question}</legend>
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const isCorrectOption =
            result !== null && option.id === result.correctOptionId

          return (
            <label
              key={option.id}
              className="block cursor-pointer has-[:disabled]:cursor-default"
            >
              <input
                className="peer sr-only"
                type="radio"
                name={`quiz-${activityId}`}
                value={option.id}
                checked={isSelected}
                onChange={() => setSelectedOptionId(option.id)}
              />
              <span
                className={`block min-h-12 rounded-xl border px-4 py-3 text-left transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--signal)] ${
                  isCorrectOption
                    ? "border-[var(--leaf)] bg-[var(--seedling-soft)]"
                    : isSelected
                      ? "border-[var(--signal)] bg-[var(--seedling-soft)]"
                      : "border-[var(--line)] bg-white hover:border-[var(--seedling)]"
                }`}
              >
                {option.text}
                {result !== null && (isCorrectOption || isSelected) ? (
                  <small className="mt-1 block font-bold text-[var(--leaf)]">
                    {isCorrectOption ? "Đáp án đúng" : "Bạn đã chọn"}
                  </small>
                ) : null}
              </span>
            </label>
          )
        })}
      </fieldset>

      {result === null ? (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOptionId || isPending}
          className="w-fit"
        >
          {isPending ? "Đang kiểm chứng..." : "Kiểm chứng câu trả lời"}
        </Button>
      ) : (
        <div className="grid gap-4" aria-live="polite">
          <p
            className={`rounded-xl border p-4 text-sm leading-6 ${result.correct ? "border-[var(--seedling)] bg-[var(--seedling-soft)] text-[var(--leaf)]" : "border-red-200 bg-red-50 text-red-900"}`}
          >
            <strong>{result.correct ? "Chính xác. " : "Chưa đúng. "}</strong>
            {result.explanation}
          </p>

          {result.correct && result.reward ? (
            <section
              className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5"
              aria-label="Kết quả hoạt động"
            >
              <p className="text-sm font-bold text-[var(--leaf)]">
                {result.reward.dailyRewardGranted
                  ? `Đã nhận lúa hôm nay · Số dư ${result.reward.balance}`
                  : `Tiến độ đã lưu · Lúa hôm nay đã nhận trước đó`}
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
              variant="outline"
              onClick={retry}
              className="w-fit"
            >
              Thử lại
            </Button>
          )}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  )
}
