import { cn } from "@/lib/utils"

const steps = ["Học", "Kiểm chứng", "Nhận lúa", "Đổi quà"]

type LearningJourneyProps = {
  activeStep?: number
  className?: string
}

export function LearningJourney({
  activeStep = 0,
  className,
}: LearningJourneyProps) {
  return (
    <ol className={cn("learning-journey", className)} aria-label="Lộ trình học">
      {steps.map((step, index) => {
        const state =
          index < activeStep ? "done" : index === activeStep ? "now" : "next"

        return (
          <li key={step} data-state={state}>
            <span className="journey-node" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              <small>
                {state === "done"
                  ? "Đã xong"
                  : state === "now"
                    ? "Hiện tại"
                    : "Tiếp theo"}
              </small>
              <strong>{step}</strong>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
