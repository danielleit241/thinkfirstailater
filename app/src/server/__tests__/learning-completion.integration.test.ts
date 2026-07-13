import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"

import { auth } from "@/server/auth"
import { prisma } from "@/server/db"
import {
  getUserActivityCompletions,
  isActivityCompleted,
  submitChecklistCompletion,
  submitQuizAnswerAndComplete,
} from "@/server/learning/queries"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// exercises the actual `ActivityCompletion` unique constraint/idempotency,
// owner isolation, and the "what counts as completed" rule for quiz and
// checklist, no mocking.
describe("learning catalog: completion", () => {
  const suffix = randomUUID()
  const trackSlug = `test-completion-track-${suffix}`
  const moduleSlug = `test-completion-module-${suffix}`
  const inactiveModuleSlug = `test-completion-module-inactive-${suffix}`
  const quizSlug = `test-completion-quiz-${suffix}`
  const checklistSlug = `test-completion-checklist-${suffix}`
  const inactiveActivitySlug = `test-completion-inactive-activity-${suffix}`

  const userAEmail = `completion-user-a-${suffix}@example.com`
  const userBEmail = `completion-user-b-${suffix}@example.com`
  const password = "correct-horse-battery-staple"

  let userAId: string
  let userBId: string
  let quizActivityId: string
  let checklistActivityId: string
  let inactiveActivityId: string

  afterAll(async () => {
    await prisma.activityCompletion.deleteMany({
      where: { userId: { in: [userAId, userBId].filter(Boolean) } },
    })
    await prisma.activity.deleteMany({
      where: {
        slug: { in: [quizSlug, checklistSlug, inactiveActivitySlug] },
      },
    })
    await prisma.module.deleteMany({
      where: { slug: { in: [moduleSlug, inactiveModuleSlug] } },
    })
    await prisma.track.deleteMany({ where: { slug: trackSlug } })
    await prisma.user.deleteMany({
      where: { email: { in: [userAEmail, userBEmail] } },
    })
    await prisma.$disconnect()
  })

  it("sets up an active track/module with a quiz, a checklist, and two users", async () => {
    const track = await prisma.track.create({
      data: {
        slug: trackSlug,
        title: "Track hoàn thành",
        description: "Track dùng để kiểm thử completion.",
      },
    })

    const activeModule = await prisma.module.create({
      data: {
        slug: moduleSlug,
        title: "Module hoàn thành",
        description: "Module dùng để kiểm thử completion.",
        trackId: track.id,
      },
    })

    const inactiveModule = await prisma.module.create({
      data: {
        slug: inactiveModuleSlug,
        title: "Module ẩn",
        description: "Module không active.",
        trackId: track.id,
        active: false,
      },
    })

    const quiz = await prisma.activity.create({
      data: {
        slug: quizSlug,
        title: "Quiz hoàn thành",
        type: "QUIZ",
        moduleId: activeModule.id,
        payload: {
          question: "2 + 2 = ?",
          options: [
            { id: "a", text: "3" },
            { id: "b", text: "4" },
          ],
          correctOptionId: "b",
          explanation: "2 + 2 = 4.",
        },
      },
    })
    quizActivityId = quiz.id

    const checklist = await prisma.activity.create({
      data: {
        slug: checklistSlug,
        title: "Checklist hoàn thành",
        type: "CHECKLIST",
        moduleId: activeModule.id,
        payload: {
          items: [
            { id: "item-1", label: "Mục 1", detail: "Chi tiết 1" },
            { id: "item-2", label: "Mục 2", detail: "Chi tiết 2" },
          ],
        },
      },
    })
    checklistActivityId = checklist.id

    const inactiveActivity = await prisma.activity.create({
      data: {
        slug: inactiveActivitySlug,
        title: "Quiz ẩn",
        type: "QUIZ",
        moduleId: inactiveModule.id,
        payload: {
          question: "1 = ?",
          options: [
            { id: "a", text: "1" },
            { id: "b", text: "2" },
          ],
          correctOptionId: "a",
          explanation: "1 = 1.",
        },
      },
    })
    inactiveActivityId = inactiveActivity.id

    await auth.api.signUpEmail({
      body: { name: "User A", email: userAEmail, password },
    })
    const userA = await prisma.user.findUniqueOrThrow({
      where: { email: userAEmail },
    })
    userAId = userA.id

    await auth.api.signUpEmail({
      body: { name: "User B", email: userBEmail, password },
    })
    const userB = await prisma.user.findUniqueOrThrow({
      where: { email: userBEmail },
    })
    userBId = userB.id
  })

  it("does not record a quiz completion for a wrong answer", async () => {
    const graded = await submitQuizAnswerAndComplete(
      userAId,
      quizActivityId,
      "a",
    )
    expect(graded.correct).toBe(false)
    expect(graded.completed).toBe(false)

    const completed = await isActivityCompleted(userAId, quizActivityId)
    expect(completed).toBe(false)
  })

  it("records exactly one quiz completion row for a correct answer, and resubmitting stays idempotent", async () => {
    const graded = await submitQuizAnswerAndComplete(
      userAId,
      quizActivityId,
      "b",
    )
    expect(graded.correct).toBe(true)
    expect(graded.completed).toBe(true)

    const resubmitted = await submitQuizAnswerAndComplete(
      userAId,
      quizActivityId,
      "b",
    )
    expect(resubmitted.completed).toBe(true)

    const rowCount = await prisma.activityCompletion.count({
      where: { userId: userAId, activityId: quizActivityId },
    })
    expect(rowCount).toBe(1)
  })

  it("rejects a quiz completion attempt against an inactive activity", async () => {
    await expect(
      submitQuizAnswerAndComplete(userAId, inactiveActivityId, "a"),
    ).rejects.toThrow()

    const completed = await isActivityCompleted(userAId, inactiveActivityId)
    expect(completed).toBe(false)
  })

  it("rejects a quiz completion attempt against a non-existent activity id", async () => {
    await expect(
      submitQuizAnswerAndComplete(userAId, "not-a-real-activity-id", "a"),
    ).rejects.toThrow()
  })

  it("does not record a checklist completion when the client sends fewer item ids than the real checklist has", async () => {
    const result = await submitChecklistCompletion(
      userAId,
      checklistActivityId,
      ["item-1"],
    )
    expect(result.completed).toBe(false)

    const completed = await isActivityCompleted(userAId, checklistActivityId)
    expect(completed).toBe(false)
  })

  it("ignores a bogus item id and still requires every real item id to be present", async () => {
    const result = await submitChecklistCompletion(
      userAId,
      checklistActivityId,
      ["item-1", "a-made-up-item-id-that-does-not-exist"],
    )
    expect(result.completed).toBe(false)
  })

  it("records exactly one checklist completion row when all real items are ticked, and resubmitting stays idempotent", async () => {
    const result = await submitChecklistCompletion(
      userAId,
      checklistActivityId,
      ["item-1", "item-2"],
    )
    expect(result.completed).toBe(true)

    const resubmitted = await submitChecklistCompletion(
      userAId,
      checklistActivityId,
      ["item-1", "item-2"],
    )
    expect(resubmitted.completed).toBe(true)

    const rowCount = await prisma.activityCompletion.count({
      where: { userId: userAId, activityId: checklistActivityId },
    })
    expect(rowCount).toBe(1)
  })

  it("enforces owner isolation: user B does not see user A's completions", async () => {
    const userBQuiz = await isActivityCompleted(userBId, quizActivityId)
    const userBChecklist = await isActivityCompleted(
      userBId,
      checklistActivityId,
    )
    expect(userBQuiz).toBe(false)
    expect(userBChecklist).toBe(false)

    const userACompletions = await getUserActivityCompletions(userAId, [
      quizActivityId,
      checklistActivityId,
    ])
    expect(userACompletions.has(quizActivityId)).toBe(true)
    expect(userACompletions.has(checklistActivityId)).toBe(true)

    const userBCompletions = await getUserActivityCompletions(userBId, [
      quizActivityId,
      checklistActivityId,
    ])
    expect(userBCompletions.size).toBe(0)
  })

  it("persists completion across a fresh read (simulating refresh/re-login)", async () => {
    const completedAfterReread = await isActivityCompleted(
      userAId,
      quizActivityId,
    )
    expect(completedAfterReread).toBe(true)
  })
})
