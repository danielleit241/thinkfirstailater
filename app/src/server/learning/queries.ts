import { prisma } from "@/server/db"
import {
  claimDailyReward,
  type DailyClaimResult,
} from "@/server/rewards/service"
import {
  checklistPayloadSchema,
  lessonPayloadSchema,
  quizPayloadSchema,
  toQuizQuestionView,
} from "./schemas"
import type {
  ActivityDetail,
  LearningOverview,
  ModuleWithActivities,
  TrackDetail,
  TrackListItem,
} from "./types"

/**
 * Dashboard projection for activities that can actually be completed.
 * LESSON is intentionally excluded: it is reference reading and the domain
 * has no lesson-completion mutation, so including it would create progress
 * that can never reach 100% and a "next activity" that never advances.
 */
export async function getUserLearningOverview(
  userId: string,
): Promise<LearningOverview> {
  const tracks = await prisma.track.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      slug: true,
      title: true,
      modules: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          activities: {
            where: {
              active: true,
              type: { in: ["QUIZ", "CHECKLIST"] },
            },
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "asc" },
              { id: "asc" },
            ],
            select: { id: true, slug: true, title: true, type: true },
          },
        },
      },
    },
  })

  const activities = tracks.flatMap((track) =>
    track.modules.flatMap((module) =>
      module.activities.map((activity) => ({
        ...activity,
        trackSlug: track.slug,
        trackTitle: track.title,
      })),
    ),
  )

  const completedIds = await getUserActivityCompletions(
    userId,
    activities.map((activity) => activity.id),
  )
  const nextActivity = activities.find(
    (activity) => !completedIds.has(activity.id),
  )

  return {
    totalActionable: activities.length,
    completedActionable: completedIds.size,
    nextActivity: nextActivity
      ? {
          title: nextActivity.title,
          type: nextActivity.type as "QUIZ" | "CHECKLIST",
          trackTitle: nextActivity.trackTitle,
          href: `/catalog/${nextActivity.trackSlug}/${nextActivity.slug}`,
        }
      : null,
  }
}

/**
 * All catalog reads below only ever return `active: true` content. There is
 * no CMS/admin authoring UI in this phase (see plan "Not Doing"), so there is
 * no reader that needs to see inactive drafts — inactive rows exist purely
 * so seed/test data can prove the filter works.
 */

export async function listActiveTracks(): Promise<TrackListItem[]> {
  const tracks = await prisma.track.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      modules: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          description: true,
          activities: {
            where: { active: true },
            select: { type: true },
          },
        },
      },
    },
  })

  return tracks.map((track) => {
    const activities = track.modules.flatMap((module) => module.activities)
    const lessonCount = activities.filter(
      (activity) => activity.type === "LESSON",
    ).length

    return {
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      skillOutcome:
        track.modules[0]?.description ??
        "Biết áp dụng một thói quen làm việc cùng AI vào công việc thật.",
      lessonCount,
      actionableCount: activities.length - lessonCount,
      estimatedMinutes: activities.length * 2,
    }
  })
}

export async function getTrackDetail(
  trackSlug: string,
): Promise<TrackDetail | null> {
  const track = await prisma.track.findFirst({
    where: { slug: trackSlug, active: true },
    include: {
      modules: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        include: {
          activities: {
            where: { active: true },
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "asc" },
              { id: "asc" },
            ],
          },
        },
      },
    },
  })

  if (!track) {
    return null
  }

  const modules: ModuleWithActivities[] = track.modules.map((module) => ({
    id: module.id,
    slug: module.slug,
    title: module.title,
    description: module.description,
    activities: module.activities.map((activity) => ({
      id: activity.id,
      slug: activity.slug,
      title: activity.title,
      type: activity.type,
    })),
  }))
  const activities = modules.flatMap((module) => module.activities)
  const lessonCount = activities.filter(
    (activity) => activity.type === "LESSON",
  ).length

  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    description: track.description,
    skillOutcome:
      modules[0]?.description ??
      "Biết áp dụng một thói quen làm việc cùng AI vào công việc thật.",
    lessonCount,
    actionableCount: activities.length - lessonCount,
    estimatedMinutes: activities.length * 2,
    modules,
  }
}

/**
 * Reads a single activity by its real slug (scoped to an active track +
 * active module), never by a client-supplied id/type. Returns a client-safe
 * projection — for QUIZ, the correct answer and explanation are stripped
 * before the question is shown.
 */
export async function getActivityDetail(
  trackSlug: string,
  activitySlug: string,
): Promise<ActivityDetail | null> {
  const activity = await prisma.activity.findFirst({
    where: {
      slug: activitySlug,
      active: true,
      module: {
        active: true,
        track: { slug: trackSlug, active: true },
      },
    },
  })

  if (!activity) {
    return null
  }

  switch (activity.type) {
    case "LESSON": {
      const lesson = lessonPayloadSchema.parse(activity.payload)
      return {
        type: "LESSON",
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        body: lesson.body,
        objective: lesson.objective,
        example: lesson.example,
        practice: lesson.practice,
        takeaway: lesson.takeaway,
      }
    }
    case "QUIZ": {
      const quiz = quizPayloadSchema.parse(activity.payload)
      const view = toQuizQuestionView(quiz)
      return {
        type: "QUIZ",
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        question: view.question,
        options: view.options,
      }
    }
    case "CHECKLIST": {
      const checklist = checklistPayloadSchema.parse(activity.payload)
      return {
        type: "CHECKLIST",
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        items: checklist.items,
      }
    }
  }
}

/**
 * Grades a quiz answer server-side against the real stored answer. There is
 * no completion/progress persistence in this phase (Phase 5) — the result is
 * computed and returned directly, not saved.
 */
export async function gradeQuizAnswer(
  activityId: string,
  selectedOptionId: string,
): Promise<{ correct: boolean; correctOptionId: string; explanation: string }> {
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      type: "QUIZ",
      active: true,
      module: { active: true, track: { active: true } },
    },
  })

  if (!activity) {
    throw new Error("Quiz not found")
  }

  const quiz = quizPayloadSchema.parse(activity.payload)

  const isValidOption = quiz.options.some(
    (option) => option.id === selectedOptionId,
  )
  if (!isValidOption) {
    throw new Error("Invalid option")
  }

  return {
    correct: selectedOptionId === quiz.correctOptionId,
    correctOptionId: quiz.correctOptionId,
    explanation: quiz.explanation,
  }
}

/**
 * Whether `userId` has a durable completion row for `activityId`. Always
 * scoped by the `userId` argument the caller passes in — callers MUST pass
 * the id from the caller's own session (never a client-supplied id), so one
 * user can never read another user's completion status.
 */
export async function isActivityCompleted(
  userId: string,
  activityId: string,
): Promise<boolean> {
  const completion = await prisma.activityCompletion.findUnique({
    where: { userId_activityId: { userId, activityId } },
  })
  return completion !== null
}

/**
 * Completion status for a batch of activities, keyed by activity id. Used
 * by catalog/track views to render a "done" indicator per activity without
 * one query per activity.
 */
export async function getUserActivityCompletions(
  userId: string,
  activityIds: string[],
): Promise<Set<string>> {
  if (activityIds.length === 0) {
    return new Set()
  }

  const completions = await prisma.activityCompletion.findMany({
    where: { userId, activityId: { in: activityIds } },
    select: { activityId: true },
  })

  return new Set(completions.map((completion) => completion.activityId))
}

/**
 * Grades a quiz answer (re-using `gradeQuizAnswer`'s real server-side
 * grading — the client's own claim of correctness is never trusted) and, if
 * and only if the answer is actually correct, records a durable completion.
 * Completion rule: QUIZ is "completed" exactly when the selected option
 * equals the real `correctOptionId` stored in the activity's payload.
 *
 * Idempotent: writing uses `upsert` on the `(userId, activityId)` unique
 * constraint, so resubmitting a correct answer (or answering correctly
 * again after a prior correct submission) never creates a second row and
 * never throws on the unique constraint.
 *
 * After a successful completion write, attempts the daily rice reward claim
 * for today's business date (see `claimDailyReward`) — a resubmit of an
 * already-completed activity still attempts the claim, but the claim itself
 * is idempotent per business date, so this never grants a second reward.
 */
export async function submitQuizAnswerAndComplete(
  userId: string,
  activityId: string,
  selectedOptionId: string,
): Promise<{
  correct: boolean
  correctOptionId: string
  explanation: string
  completed: boolean
  reward: DailyClaimResult | null
}> {
  const graded = await gradeQuizAnswer(activityId, selectedOptionId)

  let reward: DailyClaimResult | null = null
  if (graded.correct) {
    await prisma.activityCompletion.upsert({
      where: { userId_activityId: { userId, activityId } },
      update: {},
      create: { userId, activityId },
    })
    reward = await claimDailyReward(userId, activityId)
  }

  const completed = await isActivityCompleted(userId, activityId)

  return { ...graded, completed, reward }
}

/**
 * Records a checklist completion. Completion rule: CHECKLIST is "completed"
 * exactly when every real item id from the activity's own payload (read
 * fresh from the DB, never trusted from the client) is present in
 * `checkedItemIds`. The client only ever supplies which item ids it claims
 * to have ticked — it is never allowed to send a `completed`/`allChecked`
 * flag directly, and even if it did, this function ignores such a flag and
 * always re-derives completion from the real item list vs. the ids sent.
 *
 * Idempotent via `upsert` on `(userId, activityId)`, same as the quiz path.
 *
 * After a successful completion write, attempts the daily rice reward claim
 * for today's business date — see `submitQuizAnswerAndComplete` for why a
 * resubmit is safe to re-attempt (the claim itself is idempotent per day).
 */
export async function submitChecklistCompletion(
  userId: string,
  activityId: string,
  checkedItemIds: string[],
): Promise<{ completed: boolean; reward: DailyClaimResult | null }> {
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      type: "CHECKLIST",
      active: true,
      module: { active: true, track: { active: true } },
    },
  })

  if (!activity) {
    throw new Error("Checklist not found")
  }

  const checklist = checklistPayloadSchema.parse(activity.payload)
  const checkedSet = new Set(checkedItemIds)
  const allItemsChecked = checklist.items.every((item) =>
    checkedSet.has(item.id),
  )

  let reward: DailyClaimResult | null = null
  if (allItemsChecked) {
    await prisma.activityCompletion.upsert({
      where: { userId_activityId: { userId, activityId } },
      update: {},
      create: { userId, activityId },
    })
    reward = await claimDailyReward(userId, activityId)
  }

  const completed = await isActivityCompleted(userId, activityId)

  return { completed, reward }
}
