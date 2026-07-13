import { describe, expect, it } from "vitest"

import {
  checklistPayloadSchema,
  lessonPayloadSchema,
  parseActivityPayload,
  quizPayloadSchema,
  toQuizQuestionView,
} from "@/server/learning/schemas"

// Pure unit tests — no DB. Covers the discriminated payload validation and
// the projection that must strip the quiz answer before it reaches a client.
describe("learning payload schemas", () => {
  it("parses a valid LESSON payload", () => {
    const result = lessonPayloadSchema.parse({ body: "Nội dung bài học." })
    expect(result.body).toBe("Nội dung bài học.")
  })

  it("rejects a LESSON payload with an empty body", () => {
    expect(() => lessonPayloadSchema.parse({ body: "" })).toThrow()
  })

  it("parses a valid QUIZ payload", () => {
    const result = quizPayloadSchema.parse({
      question: "2 + 2 = ?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
      correctOptionId: "b",
      explanation: "2 + 2 = 4.",
    })
    expect(result.correctOptionId).toBe("b")
  })

  it("rejects a QUIZ payload whose correctOptionId is not one of the options", () => {
    expect(() =>
      quizPayloadSchema.parse({
        question: "2 + 2 = ?",
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
        ],
        correctOptionId: "c",
        explanation: "2 + 2 = 4.",
      }),
    ).toThrow()
  })

  it("rejects a QUIZ payload with fewer than 2 options", () => {
    expect(() =>
      quizPayloadSchema.parse({
        question: "2 + 2 = ?",
        options: [{ id: "a", text: "4" }],
        correctOptionId: "a",
        explanation: "2 + 2 = 4.",
      }),
    ).toThrow()
  })

  it("parses a valid CHECKLIST payload", () => {
    const result = checklistPayloadSchema.parse({
      items: [{ id: "1", label: "Mục 1", detail: "Chi tiết 1" }],
    })
    expect(result.items).toHaveLength(1)
  })

  it("rejects a CHECKLIST payload with no items", () => {
    expect(() => checklistPayloadSchema.parse({ items: [] })).toThrow()
  })

  it("parseActivityPayload dispatches on the activity's own type, not client input", () => {
    const lesson = parseActivityPayload("LESSON", { body: "abc" })
    expect(lesson).toEqual({ body: "abc" })

    expect(() => parseActivityPayload("LESSON", { question: "abc" })).toThrow()
  })

  it("toQuizQuestionView strips the correct answer and explanation", () => {
    const payload = quizPayloadSchema.parse({
      question: "2 + 2 = ?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
      correctOptionId: "b",
      explanation: "2 + 2 = 4.",
    })

    const view = toQuizQuestionView(payload)

    expect(view).toEqual({
      question: "2 + 2 = ?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
    })
    expect(view).not.toHaveProperty("correctOptionId")
    expect(view).not.toHaveProperty("explanation")
  })
})
