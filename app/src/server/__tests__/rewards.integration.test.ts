import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"

import { prisma } from "@/server/db"
import {
  submitChecklistCompletion,
  submitQuizAnswerAndComplete,
} from "@/server/learning/queries"
import { claimDailyReward } from "@/server/rewards/service"
import { seedRewardConfig } from "@/server/rewards/seed-data"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// no mocking. Covers the highest-risk invariants in the plan: concurrent
// double-claim prevention via the DB unique constraint (not an in-memory
// lock), Asia/Ho_Chi_Minh business-date boundaries, streak increment/reset,
// and the ledger/balance reconciliation invariant.
describe("rewards: daily streak and ledger", () => {
  const suffix = randomUUID()
  const trackSlug = `test-rewards-track-${suffix}`
  const moduleSlug = `test-rewards-module-${suffix}`
  const quizASlug = `test-rewards-quiz-a-${suffix}`
  const quizBSlug = `test-rewards-quiz-b-${suffix}`
  const checklistSlug = `test-rewards-checklist-${suffix}`

  const userIds: string[] = []

  function createTestUser(email: string) {
    return prisma.user.create({
      data: { id: randomUUID(), name: "Reward Test User", email },
    })
  }

  let quizAId: string
  let quizBId: string
  let checklistActivityId: string
  let dailyRewardAmount: number

  afterAll(async () => {
    await prisma.riceLedgerEntry.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.dailyReward.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.riceBalance.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.activityCompletion.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.activity.deleteMany({
      where: { slug: { in: [quizASlug, quizBSlug, checklistSlug] } },
    })
    await prisma.module.deleteMany({ where: { slug: moduleSlug } })
    await prisma.track.deleteMany({ where: { slug: trackSlug } })
    await prisma.$disconnect()
  })

  it("seeds reward config and sets up a track/module with two quizzes and a checklist", async () => {
    const config = await seedRewardConfig()
    dailyRewardAmount = config.dailyRewardAmount

    const track = await prisma.track.create({
      data: {
        slug: trackSlug,
        title: "Track thưởng",
        description: "Track dùng để kiểm thử daily reward.",
      },
    })

    const learningModule = await prisma.module.create({
      data: {
        slug: moduleSlug,
        title: "Module thưởng",
        description: "Module dùng để kiểm thử daily reward.",
        trackId: track.id,
      },
    })

    const quizPayload = {
      question: "2 + 2 = ?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
      correctOptionId: "b",
      explanation: "2 + 2 = 4.",
    }

    const quizA = await prisma.activity.create({
      data: {
        slug: quizASlug,
        title: "Quiz A",
        type: "QUIZ",
        moduleId: learningModule.id,
        payload: quizPayload,
      },
    })
    quizAId = quizA.id

    const quizB = await prisma.activity.create({
      data: {
        slug: quizBSlug,
        title: "Quiz B",
        type: "QUIZ",
        moduleId: learningModule.id,
        payload: quizPayload,
      },
    })
    quizBId = quizB.id

    const checklist = await prisma.activity.create({
      data: {
        slug: checklistSlug,
        title: "Checklist thưởng",
        type: "CHECKLIST",
        moduleId: learningModule.id,
        payload: {
          items: [{ id: "item-1", label: "Mục 1", detail: "Chi tiết" }],
        },
      },
    })
    checklistActivityId = checklist.id
  })

  it("two concurrent completions for the same user/business-date grant exactly one daily reward and one ledger credit", async () => {
    const user = await createTestUser(
      `rewards-concurrency-${suffix}@example.com`,
    )
    userIds.push(user.id)

    const [resultA, resultB] = await Promise.all([
      submitQuizAnswerAndComplete(user.id, quizAId, "b"),
      submitQuizAnswerAndComplete(user.id, quizBId, "b"),
    ])

    expect(resultA.completed).toBe(true)
    expect(resultB.completed).toBe(true)

    const grantedFlags = [
      resultA.reward?.dailyRewardGranted,
      resultB.reward?.dailyRewardGranted,
    ]
    const grantedCount = grantedFlags.filter(
      (granted) => granted === true,
    ).length
    // Exactly one of the two concurrent completions wins the race — never 0
    // (both lost), never 2 (both won).
    expect(grantedCount).toBe(1)

    const dailyRewardCount = await prisma.dailyReward.count({
      where: { userId: user.id },
    })
    expect(dailyRewardCount).toBe(1)

    const ledgerCount = await prisma.riceLedgerEntry.count({
      where: { userId: user.id },
    })
    expect(ledgerCount).toBe(1)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(dailyRewardAmount)
  })

  it("a further completion the same business date does not grant an additional reward", async () => {
    const user = await createTestUser(`rewards-sameday-${suffix}@example.com`)
    userIds.push(user.id)

    const first = await submitQuizAnswerAndComplete(user.id, quizAId, "b")
    expect(first.reward?.dailyRewardGranted).toBe(true)

    const second = await submitChecklistCompletion(
      user.id,
      checklistActivityId,
      ["item-1"],
    )
    expect(second.reward?.dailyRewardGranted).toBe(false)

    const dailyRewardCount = await prisma.dailyReward.count({
      where: { userId: user.id },
    })
    expect(dailyRewardCount).toBe(1)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(dailyRewardAmount)
  })

  it("computes the business date across a near-midnight Vietnam-time boundary, not UTC, and increments the streak for the next consecutive day", async () => {
    const user = await createTestUser(`rewards-midnight-${suffix}@example.com`)
    userIds.push(user.id)

    // 2026-07-13T16:59:00Z = 2026-07-13 23:59 ICT (UTC+7).
    const lateNight = new Date("2026-07-13T16:59:00.000Z")
    // 2026-07-13T17:01:00Z = 2026-07-14 00:01 ICT — the next calendar day in
    // Vietnam, only two minutes later in real time.
    const earlyMorning = new Date("2026-07-13T17:01:00.000Z")

    const day1 = await claimDailyReward(user.id, quizAId, lateNight)
    expect(day1.dailyRewardGranted).toBe(true)
    expect(day1.streakCount).toBe(1)

    const day2 = await claimDailyReward(user.id, quizAId, earlyMorning)
    expect(day2.dailyRewardGranted).toBe(true)
    expect(day2.streakCount).toBe(2)

    const rewards = await prisma.dailyReward.findMany({
      where: { userId: user.id },
      orderBy: { businessDate: "asc" },
    })
    expect(rewards).toHaveLength(2)
    expect(rewards[0]!.businessDate.toISOString().slice(0, 10)).toBe(
      "2026-07-13",
    )
    expect(rewards[1]!.businessDate.toISOString().slice(0, 10)).toBe(
      "2026-07-14",
    )
  })

  it("increases the streak on consecutive business dates and resets to 1 after a missed day, with the ledger reconciling to the balance", async () => {
    const user = await createTestUser(`rewards-streak-${suffix}@example.com`)
    userIds.push(user.id)

    const day1 = new Date("2026-08-01T05:00:00.000Z") // 2026-08-01 12:00 ICT
    const day2 = new Date("2026-08-02T05:00:00.000Z") // 2026-08-02 12:00 ICT
    const day4 = new Date("2026-08-04T05:00:00.000Z") // 2026-08-04 12:00 ICT (skips day 3)

    const claim1 = await claimDailyReward(user.id, quizAId, day1)
    expect(claim1.streakCount).toBe(1)

    const claim2 = await claimDailyReward(user.id, quizAId, day2)
    expect(claim2.streakCount).toBe(2)

    const claim4 = await claimDailyReward(user.id, quizAId, day4)
    expect(claim4.streakCount).toBe(1)

    // Reconciliation invariant: the ledger (audit source) must always sum to
    // exactly the balance projection for this user.
    const ledgerEntries = await prisma.riceLedgerEntry.findMany({
      where: { userId: user.id },
    })
    const ledgerSum = ledgerEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    )
    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(ledgerSum)
    expect(ledgerSum).toBe(dailyRewardAmount * 3)
  })
})
