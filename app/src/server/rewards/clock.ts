const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh"

const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/**
 * The "business date" for daily rewards/streaks: the calendar date in
 * `Asia/Ho_Chi_Minh`, not UTC and not the server host's local timezone. The
 * day boundary is midnight Vietnam time.
 *
 * `now` is injectable (defaults to `new Date()`) so tests can pin an exact
 * instant — e.g. 23:59 vs 00:01 Vietnam time across a day boundary — instead
 * of depending on when the test happens to run.
 *
 * Returns a UTC-midnight `Date` representing the date only (no time-of-day),
 * matching the `@db.Date` column it is stored in.
 */
export function getBusinessDate(now: Date = new Date()): Date {
  const parts = businessDateFormatter.formatToParts(now)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Failed to compute business date")
  }

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Whole-day difference between two business dates (`b - a`, in days). */
export function businessDateDiffInDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / ONE_DAY_MS)
}
