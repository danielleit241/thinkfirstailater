import type { ActivityTypeName } from "./schemas"

export type TrackListItem = {
  id: string
  slug: string
  title: string
  description: string
  skillOutcome: string
  lessonCount: number
  actionableCount: number
  estimatedMinutes: number
}

export type ActivitySummary = {
  id: string
  slug: string
  title: string
  type: ActivityTypeName
}

export type ModuleWithActivities = {
  id: string
  slug: string
  title: string
  description: string
  activities: ActivitySummary[]
}

export type TrackDetail = TrackListItem & {
  modules: ModuleWithActivities[]
}

export type LearningOverview = {
  totalActionable: number
  completedActionable: number
  nextActivity: {
    title: string
    type: "QUIZ" | "CHECKLIST"
    trackTitle: string
    href: string
  } | null
}

export type ActivityDetail =
  | {
      type: "LESSON"
      id: string
      slug: string
      title: string
      body: string
      objective?: string
      example?: { before: string; after: string }
      practice?: { prompt: string; steps: string[] }
      takeaway?: string
    }
  | {
      type: "QUIZ"
      id: string
      slug: string
      title: string
      question: string
      options: { id: string; text: string }[]
    }
  | {
      type: "CHECKLIST"
      id: string
      slug: string
      title: string
      items: { id: string; label: string; detail: string }[]
    }
