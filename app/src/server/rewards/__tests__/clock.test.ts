import { describe, expect, it } from "vitest"

import { businessDateDiffInDays, getBusinessDate } from "@/server/rewards/clock"

// Pure unit tests — no DB. Covers the Asia/Ho_Chi_Minh day-boundary rule in
// isolation from the DB-backed claim logic.
describe("rewards clock: business date", () => {
  it("computes the business date from a UTC instant using Asia/Ho_Chi_Minh (UTC+7), not UTC", () => {
    // 2026-07-13T20:00:00Z is 2026-07-14 03:00 in Vietnam.
    const businessDate = getBusinessDate(new Date("2026-07-13T20:00:00.000Z"))
    expect(businessDate.toISOString().slice(0, 10)).toBe("2026-07-14")
  })

  it("treats 23:59 Vietnam time as still the earlier calendar day", () => {
    // 2026-07-13T16:59:00Z = 2026-07-13 23:59 ICT.
    const businessDate = getBusinessDate(new Date("2026-07-13T16:59:00.000Z"))
    expect(businessDate.toISOString().slice(0, 10)).toBe("2026-07-13")
  })

  it("treats 00:01 Vietnam time as the next calendar day, one minute later", () => {
    // 2026-07-13T17:01:00Z = 2026-07-14 00:01 ICT.
    const businessDate = getBusinessDate(new Date("2026-07-13T17:01:00.000Z"))
    expect(businessDate.toISOString().slice(0, 10)).toBe("2026-07-14")
  })

  it("diffs two business dates in whole days", () => {
    const day1 = getBusinessDate(new Date("2026-07-13T16:59:00.000Z"))
    const day2 = getBusinessDate(new Date("2026-07-13T17:01:00.000Z"))
    expect(businessDateDiffInDays(day1, day2)).toBe(1)
  })
})
