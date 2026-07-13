"use server"

import { headers as nextHeaders } from "next/headers"

import { requireSession } from "@/server/auth/guards"
import {
  submitChecklistCompletion,
  submitQuizAnswerAndComplete,
} from "./queries"
import { checklistSubmissionSchema, quizSubmissionSchema } from "./schemas"

/**
 * Server Action for grading a quiz submission and recording completion.
 * Requires an authenticated session directly (not a Route Handler) and
 * re-reads the real quiz answer from the DB — the client only ever supplies
 * `activityId` + the option it picked, never the answer/correctness itself.
 * A completion row is written only when the (server-recomputed) answer is
 * actually correct; see `submitQuizAnswerAndComplete` for the rule.
 */
export async function submitQuizAnswer(
  activityId: string,
  selectedOptionId: string,
) {
  const session = await requireSession(await nextHeaders())
  const input = quizSubmissionSchema.parse({ activityId, selectedOptionId })

  return submitQuizAnswerAndComplete(
    session.user.id,
    input.activityId,
    input.selectedOptionId,
  )
}

/**
 * Server Action for recording checklist progress. The client sends only the
 * ids of the items it claims to have ticked; the server always re-reads the
 * checklist's real item list from the activity payload and only records a
 * completion when every real item id is present in what was sent — see
 * `submitChecklistCompletion` for the rule.
 */
export async function submitChecklistProgress(
  activityId: string,
  checkedItemIds: string[],
) {
  const session = await requireSession(await nextHeaders())
  const input = checklistSubmissionSchema.parse({
    activityId,
    checkedItemIds,
  })

  return submitChecklistCompletion(
    session.user.id,
    input.activityId,
    input.checkedItemIds,
  )
}
