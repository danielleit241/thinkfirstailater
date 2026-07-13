import { z } from "zod"

/**
 * Discriminated payload shapes for the 3 supported activity types. `payload`
 * is stored as Prisma `Json`, so it must be parsed/validated at the
 * boundary — never trusted as-is, and never re-exposed to the client
 * without going through the projections in `queries.ts` first (the QUIZ
 * schema below intentionally includes the correct answer; that field must
 * be stripped before a quiz question is shown to the client).
 */

export const lessonPayloadSchema = z.object({
  body: z.string().min(1),
  objective: z.string().min(1).optional(),
  example: z
    .object({
      before: z.string().min(1),
      after: z.string().min(1),
    })
    .optional(),
  practice: z
    .object({
      prompt: z.string().min(1),
      steps: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  takeaway: z.string().min(1).optional(),
})
export type LessonPayload = z.infer<typeof lessonPayloadSchema>

export const quizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
})

export const quizPayloadSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(quizOptionSchema).min(2),
    correctOptionId: z.string().min(1),
    explanation: z.string().min(1),
  })
  .refine(
    (payload) =>
      payload.options.some((option) => option.id === payload.correctOptionId),
    { message: "correctOptionId must match one of the options" },
  )
export type QuizPayload = z.infer<typeof quizPayloadSchema>

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
})

export const checklistPayloadSchema = z.object({
  items: z.array(checklistItemSchema).min(1),
})
export type ChecklistPayload = z.infer<typeof checklistPayloadSchema>

export type ActivityTypeName = "LESSON" | "QUIZ" | "CHECKLIST"

/**
 * Parse a raw (untrusted) Json payload according to the activity's own
 * `type` column — never according to a type value supplied by the client.
 * Throws if the payload does not match the expected shape for that type.
 */
export function parseActivityPayload(
  type: ActivityTypeName,
  payload: unknown,
): LessonPayload | QuizPayload | ChecklistPayload {
  switch (type) {
    case "LESSON":
      return lessonPayloadSchema.parse(payload)
    case "QUIZ":
      return quizPayloadSchema.parse(payload)
    case "CHECKLIST":
      return checklistPayloadSchema.parse(payload)
  }
}

/** Client-safe quiz projection: the question and options only, no answer. */
export function toQuizQuestionView(payload: QuizPayload) {
  return {
    question: payload.question,
    options: payload.options,
  }
}

/** Input shape for the quiz-submit Server Action — never a raw `correct`/`score`. */
export const quizSubmissionSchema = z.object({
  activityId: z.string().min(1),
  selectedOptionId: z.string().min(1),
})

/**
 * Input shape for the checklist-submit Server Action — the client sends the
 * ids of items it claims to have ticked, never a `completed`/`allChecked`
 * flag (the server always re-derives completion from the real payload).
 */
export const checklistSubmissionSchema = z.object({
  activityId: z.string().min(1),
  checkedItemIds: z.array(z.string().min(1)),
})
