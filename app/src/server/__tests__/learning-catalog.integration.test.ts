import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"

import { auth } from "@/server/auth"
import { requireSession } from "@/server/auth/guards"
import { prisma } from "@/server/db"
import {
  gradeQuizAnswer,
  getActivityDetail,
  getTrackDetail,
  listActiveTracks,
} from "@/server/learning/queries"
import {
  learningCatalogSeed,
  seedLearningCatalog,
} from "@/server/learning/seed-data"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// exercises the learning catalog query filters/ordering, the quiz-answer
// projection (must never leak the correct answer before submit), and the
// idempotent seed against the actual DB, no mocking.
describe("learning catalog: queries", () => {
  const suffix = randomUUID()
  const trackSlug = `test-track-${suffix}`
  const inactiveTrackSlug = `test-track-inactive-${suffix}`
  const activeModuleSlug = `test-module-active-${suffix}`
  const inactiveModuleSlug = `test-module-inactive-${suffix}`
  const lessonSlug = `test-lesson-${suffix}`
  const quizSlug = `test-quiz-${suffix}`
  const inactiveActivitySlug = `test-activity-inactive-${suffix}`

  afterAll(async () => {
    await prisma.activity.deleteMany({
      where: {
        slug: { in: [lessonSlug, quizSlug, inactiveActivitySlug] },
      },
    })
    await prisma.module.deleteMany({
      where: { slug: { in: [activeModuleSlug, inactiveModuleSlug] } },
    })
    await prisma.track.deleteMany({
      where: { slug: { in: [trackSlug, inactiveTrackSlug] } },
    })
    await prisma.$disconnect()
  })

  it("sets up an active track/module with a mix of active and inactive content", async () => {
    const track = await prisma.track.create({
      data: {
        slug: trackSlug,
        title: "Track kiểm thử",
        description: "Track dùng để kiểm thử filter/order.",
        sortOrder: 1,
      },
    })

    await prisma.track.create({
      data: {
        slug: inactiveTrackSlug,
        title: "Track ẩn",
        description: "Track không active, không được xuất hiện.",
        sortOrder: 0,
        active: false,
      },
    })

    const activeModule = await prisma.module.create({
      data: {
        slug: activeModuleSlug,
        title: "Module kiểm thử",
        description: "Module dùng để kiểm thử.",
        sortOrder: 0,
        trackId: track.id,
      },
    })

    await prisma.module.create({
      data: {
        slug: inactiveModuleSlug,
        title: "Module ẩn",
        description: "Module không active.",
        sortOrder: 1,
        trackId: track.id,
        active: false,
      },
    })

    // sortOrder is intentionally reversed from creation order below.
    await prisma.activity.create({
      data: {
        slug: quizSlug,
        title: "Quiz kiểm thử",
        type: "QUIZ",
        sortOrder: 1,
        moduleId: activeModule.id,
        payload: {
          question: "1 + 1 = ?",
          options: [
            { id: "a", text: "1" },
            { id: "b", text: "2" },
          ],
          correctOptionId: "b",
          explanation: "1 + 1 = 2.",
        },
      },
    })

    await prisma.activity.create({
      data: {
        slug: lessonSlug,
        title: "Bài học kiểm thử",
        type: "LESSON",
        sortOrder: 0,
        moduleId: activeModule.id,
        payload: { body: "Nội dung bài học kiểm thử." },
      },
    })

    await prisma.activity.create({
      data: {
        slug: inactiveActivitySlug,
        title: "Hoạt động ẩn",
        type: "LESSON",
        sortOrder: 2,
        moduleId: activeModule.id,
        active: false,
        payload: { body: "Không được hiển thị." },
      },
    })
  })

  it("listActiveTracks hides inactive tracks and orders by sortOrder", async () => {
    const tracks = await listActiveTracks()

    expect(tracks.some((track) => track.slug === inactiveTrackSlug)).toBe(false)

    const testTrack = tracks.find((track) => track.slug === trackSlug)
    expect(testTrack).toBeDefined()

    const sortOrders = tracks.map((_, index) => index)
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b))
  })

  it("getTrackDetail hides inactive modules/activities and orders activities by sortOrder", async () => {
    const track = await getTrackDetail(trackSlug)

    expect(track).not.toBeNull()
    expect(
      track?.modules.some((module) => module.slug === inactiveModuleSlug),
    ).toBe(false)

    const activeModule = track?.modules.find(
      (module) => module.slug === activeModuleSlug,
    )
    expect(activeModule).toBeDefined()
    expect(
      activeModule?.activities.some(
        (activity) => activity.slug === inactiveActivitySlug,
      ),
    ).toBe(false)
    expect(activeModule?.activities.map((activity) => activity.slug)).toEqual([
      lessonSlug,
      quizSlug,
    ])
  })

  it("getTrackDetail returns null for an inactive track", async () => {
    const track = await getTrackDetail(inactiveTrackSlug)
    expect(track).toBeNull()
  })

  it("getActivityDetail returns null for an inactive activity", async () => {
    const activity = await getActivityDetail(trackSlug, inactiveActivitySlug)
    expect(activity).toBeNull()
  })

  it("getActivityDetail never leaks the quiz's correct answer before submit", async () => {
    const activity = await getActivityDetail(trackSlug, quizSlug)

    expect(activity).not.toBeNull()
    expect(activity?.type).toBe("QUIZ")
    if (activity?.type !== "QUIZ") {
      throw new Error("expected QUIZ activity")
    }
    expect(activity).not.toHaveProperty("correctOptionId")
    expect(activity).not.toHaveProperty("explanation")
    expect(activity.options).toEqual([
      { id: "a", text: "1" },
      { id: "b", text: "2" },
    ])
  })

  it("gradeQuizAnswer grades correctly against the real stored answer", async () => {
    const activity = await getActivityDetail(trackSlug, quizSlug)
    if (activity?.type !== "QUIZ") {
      throw new Error("expected QUIZ activity")
    }

    const correct = await gradeQuizAnswer(activity.id, "b")
    expect(correct).toEqual({
      correct: true,
      correctOptionId: "b",
      explanation: "1 + 1 = 2.",
    })

    const incorrect = await gradeQuizAnswer(activity.id, "a")
    expect(incorrect.correct).toBe(false)
  })

  it("gradeQuizAnswer rejects an option id that does not belong to the quiz", async () => {
    const activity = await getActivityDetail(trackSlug, quizSlug)
    if (activity?.type !== "QUIZ") {
      throw new Error("expected QUIZ activity")
    }

    await expect(
      gradeQuizAnswer(activity.id, "not-a-real-option"),
    ).rejects.toThrow()
  })

  it("smoke test: an authenticated user reading the real catalog gets real content", async () => {
    const email = `catalog-smoke-${suffix}@example.com`
    const password = "correct-horse-battery-staple"

    await auth.api.signUpEmail({
      body: { name: "Catalog Smoke User", email, password },
    })
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const setCookie = signInResponse.headers.get("set-cookie")
    if (!setCookie) {
      throw new Error("Expected sign-in to set a session cookie")
    }
    const headers = new Headers({ cookie: setCookie.split(";")[0] })

    const session = await requireSession(headers)
    expect(session.user.email).toBe(email)

    const track = await getTrackDetail(trackSlug)
    expect(track?.title).toBe("Track kiểm thử")
    expect(track?.modules[0]?.activities.length).toBeGreaterThan(0)

    await prisma.user.deleteMany({ where: { email } })
  })
})

describe("learning catalog: seed idempotency", () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("running the seed twice does not create duplicate rows", async () => {
    // Scoped to this seed's own slugs — a global count() would be corrupted
    // by other test files creating Track/Module/Activity rows concurrently
    // in the same Vitest run (shared Postgres, parallel test files).
    const trackSlugs = learningCatalogSeed.map((track) => track.slug)
    const moduleSlugs = learningCatalogSeed.flatMap((track) =>
      track.modules.map((trackModule) => trackModule.slug),
    )
    const activitySlugs = learningCatalogSeed.flatMap((track) =>
      track.modules.flatMap((trackModule) =>
        trackModule.activities.map((activity) => activity.slug),
      ),
    )

    await seedLearningCatalog()

    const [tracksAfterFirst, modulesAfterFirst, activitiesAfterFirst] =
      await Promise.all([
        prisma.track.count({ where: { slug: { in: trackSlugs } } }),
        prisma.module.count({ where: { slug: { in: moduleSlugs } } }),
        prisma.activity.count({ where: { slug: { in: activitySlugs } } }),
      ])

    await seedLearningCatalog()

    const [tracksAfterSecond, modulesAfterSecond, activitiesAfterSecond] =
      await Promise.all([
        prisma.track.count({ where: { slug: { in: trackSlugs } } }),
        prisma.module.count({ where: { slug: { in: moduleSlugs } } }),
        prisma.activity.count({ where: { slug: { in: activitySlugs } } }),
      ])

    expect(tracksAfterSecond).toBe(tracksAfterFirst)
    expect(modulesAfterSecond).toBe(modulesAfterFirst)
    expect(activitiesAfterSecond).toBe(activitiesAfterFirst)
  })
})
