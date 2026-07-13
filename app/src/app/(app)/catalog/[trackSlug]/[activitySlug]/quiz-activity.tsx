"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { submitQuizAnswer } from "@/server/learning/actions"

type Option = { id: string; text: string }

export function QuizActivity({
  activityId,
  question,
  options,
  initialCompleted,
}: {
  activityId: string
  question: string
  options: Option[]
  initialCompleted: boolean
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<{
    correct: boolean
    correctOptionId: string
    explanation: string
  } | null>(null)
  const [completed, setCompleted] = useState(initialCompleted)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selectedOptionId) {
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const graded = await submitQuizAnswer(activityId, selectedOptionId)
        setResult(graded)
        setCompleted(graded.completed)
      } catch {
        setError("Không thể chấm câu trả lời, vui lòng thử lại.")
      }
    })
  }

  return (
    <div className="grid gap-4">
      {completed ? (
        <p className="text-sm font-semibold text-[var(--insight-orange)]">
          Bạn đã hoàn thành hoạt động này.
        </p>
      ) : null}

      <p className="text-lg font-semibold">{question}</p>

      <div className="grid gap-2" role="radiogroup" aria-label={question}>
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const isCorrectOption =
            result !== null && option.id === result.correctOptionId

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={result !== null}
              onClick={() => setSelectedOptionId(option.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                isCorrectOption
                  ? "border-[var(--insight-orange)] bg-[var(--insight-orange)]/10"
                  : isSelected
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/30"
              }`}
            >
              {option.text}
            </button>
          )
        })}
      </div>

      {result === null ? (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOptionId || isPending}
          className="w-fit"
        >
          {isPending ? "Đang chấm..." : "Nộp câu trả lời"}
        </Button>
      ) : (
        <p
          className={`rounded-xl border p-4 text-sm ${
            result.correct
              ? "border-[var(--insight-orange)]/40 text-white"
              : "border-white/20 text-white/80"
          }`}
        >
          {result.correct ? "Chính xác! " : "Chưa đúng. "}
          {result.explanation}
        </p>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
