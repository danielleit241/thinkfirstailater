import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"

import { auth } from "@/server/auth"
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/server/auth/guards"
import { prisma } from "@/server/db"
import { getTrackDetail, listActiveTracks } from "@/server/learning/queries"
import { claimDailyReward } from "@/server/rewards/service"
import { redeemVoucher } from "@/server/vouchers/service"

import {
  updateContentStatusSchema,
  updateRewardConfigSchema,
  updateVoucherSchema,
} from "@/server/admin/schemas"
import {
  updateModuleStatus,
  updateRewardConfig,
  updateTrackStatus,
  updateVoucher,
} from "@/server/admin/service"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// no mocking. Covers Phase 8's highest-risk invariants: every admin mutation
// must be forbidden to anonymous/USER callers with zero side effects,
// malformed/negative input must never reach the DB, and editing the mutable
// config/voucher/content rows must never rewrite already-recorded reward/
// redemption history (non-retroactivity), while immediately affecting the
// USER-facing catalog for content status/order.
describe("admin: authz, validation, non-retroactivity", () => {
  const suffix = randomUUID()
  const password = "correct-horse-battery-staple"

  const userIds: string[] = []
  const trackIds: string[] = []
  const moduleIds: string[] = []
  const activityIds: string[] = []
  const voucherIds: string[] = []

  function createTestUser(email: string, name = "Admin Test User") {
    return prisma.user
      .create({ data: { id: randomUUID(), name, email } })
      .then((user) => {
        userIds.push(user.id)
        return user
      })
  }

  async function signInAndGetHeaders(email: string) {
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
    const setCookie = signInResponse.headers.get("set-cookie")
    if (!setCookie) {
      throw new Error("Expected sign-in to set a session cookie")
    }
    return new Headers({ cookie: setCookie.split(";")[0] })
  }

  /**
   * Mirrors exactly what every admin Server Action in `admin/actions.ts`
   * does: `requireRole(headers, "ADMIN")` first, then (only if that
   * resolves) the actual service call. A "use server" action itself cannot
   * be invoked directly outside a Next.js request scope (`next/headers`
   * requires one, which vitest does not provide), so this composes the same
   * two real, directly-imported functions the action uses — proving the
   * identical security contract without duplicating it.
   */
  async function callAsAdminAction<T>(
    headers: Headers,
    run: () => Promise<T>,
  ): Promise<T> {
    await requireRole(headers, "ADMIN")
    return run()
  }

  afterAll(async () => {
    await prisma.voucherRedemption.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.riceLedgerEntry.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.riceBalance.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.dailyReward.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.activityCompletion.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.activity.deleteMany({ where: { id: { in: activityIds } } })
    await prisma.module.deleteMany({ where: { id: { in: moduleIds } } })
    await prisma.track.deleteMany({ where: { id: { in: trackIds } } })
    await prisma.voucher.deleteMany({ where: { id: { in: voucherIds } } })
    await prisma.$disconnect()
  })

  describe("role matrix: anonymous / USER are rejected with no side effect", () => {
    it("rejects an anonymous caller updating the reward config", async () => {
      const before = await prisma.rewardConfig.findFirst({
        orderBy: { createdAt: "desc" },
      })

      await expect(
        callAsAdminAction(new Headers(), () =>
          updateRewardConfig("irrelevant", 999),
        ),
      ).rejects.toBeInstanceOf(UnauthorizedError)

      const after = await prisma.rewardConfig.findFirst({
        orderBy: { createdAt: "desc" },
      })
      expect(after?.dailyRewardAmount).toBe(before?.dailyRewardAmount)
      expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime())
    })

    it("rejects a USER session updating the reward config", async () => {
      const email = `admin-role-user-reward-${suffix}@example.com`
      await auth.api.signUpEmail({
        body: { name: "Role User", email, password },
      })
      const createdUser = await prisma.user.findUniqueOrThrow({
        where: { email },
      })
      userIds.push(createdUser.id)
      const headers = await signInAndGetHeaders(email)

      const before = await prisma.rewardConfig.findFirst({
        orderBy: { createdAt: "desc" },
      })

      await expect(
        callAsAdminAction(headers, () =>
          updateRewardConfig(createdUser.id, 999),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)

      const after = await prisma.rewardConfig.findFirst({
        orderBy: { createdAt: "desc" },
      })
      expect(after?.dailyRewardAmount).toBe(before?.dailyRewardAmount)
    })

    it("rejects a USER session updating a voucher, with no side effect", async () => {
      const email = `admin-role-user-voucher-${suffix}@example.com`
      await auth.api.signUpEmail({
        body: { name: "Role User", email, password },
      })
      const createdUser = await prisma.user.findUniqueOrThrow({
        where: { email },
      })
      userIds.push(createdUser.id)
      const headers = await signInAndGetHeaders(email)

      const voucher = await prisma.voucher.create({
        data: {
          slug: `admin-test-voucher-role-${suffix}`,
          brand: "Test Brand",
          title: "Test Voucher",
          description: "Voucher demo dùng để kiểm thử.",
          riceCost: 50,
        },
      })
      voucherIds.push(voucher.id)

      await expect(
        callAsAdminAction(headers, () =>
          updateVoucher(createdUser.id, voucher.id, {
            riceCost: 1,
            active: false,
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)

      const after = await prisma.voucher.findUnique({
        where: { id: voucher.id },
      })
      expect(after?.riceCost).toBe(50)
      expect(after?.active).toBe(true)
    })

    it("rejects an anonymous caller updating track status, with no side effect", async () => {
      const track = await prisma.track.create({
        data: {
          slug: `admin-test-track-anon-${suffix}`,
          title: "Track anon",
          description: "demo",
          active: true,
          sortOrder: 1,
        },
      })
      trackIds.push(track.id)

      await expect(
        callAsAdminAction(new Headers(), () =>
          updateTrackStatus("irrelevant", track.id, { active: false }),
        ),
      ).rejects.toBeInstanceOf(UnauthorizedError)

      const after = await prisma.track.findUnique({ where: { id: track.id } })
      expect(after?.active).toBe(true)
    })
  })

  describe("input validation: malformed/negative values are rejected before touching the DB", () => {
    it("rejects dailyRewardAmount of 0 and negative values", () => {
      expect(() =>
        updateRewardConfigSchema.parse({ dailyRewardAmount: 0 }),
      ).toThrow()
      expect(() =>
        updateRewardConfigSchema.parse({ dailyRewardAmount: -5 }),
      ).toThrow()
    })

    it("rejects a non-positive voucher riceCost", () => {
      expect(() =>
        updateVoucherSchema.parse({ voucherId: "x", riceCost: 0 }),
      ).toThrow()
      expect(() =>
        updateVoucherSchema.parse({ voucherId: "x", riceCost: -10 }),
      ).toThrow()
    })

    it("rejects a voucher update with neither riceCost nor active set", () => {
      expect(() => updateVoucherSchema.parse({ voucherId: "x" })).toThrow()
    })

    it("rejects a negative sortOrder for track/module/activity status updates", () => {
      expect(() =>
        updateContentStatusSchema.parse({ id: "x", sortOrder: -1 }),
      ).toThrow()
    })

    it("rejects a content status update with neither active nor sortOrder set", () => {
      expect(() => updateContentStatusSchema.parse({ id: "x" })).toThrow()
    })
  })

  describe("ADMIN golden flow + non-retroactivity", () => {
    it("changing dailyRewardAmount never rewrites an already-granted DailyReward; a claim after the change uses the new amount", async () => {
      const adminEmail = `admin-golden-reward-${suffix}@example.com`
      await auth.api.signUpEmail({
        body: { name: "Golden Admin", email: adminEmail, password },
      })
      const adminUser = await prisma.user.findUniqueOrThrow({
        where: { email: adminEmail },
      })
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN" },
      })
      userIds.push(adminUser.id)
      const adminHeaders = await signInAndGetHeaders(adminEmail)

      const track = await prisma.track.create({
        data: {
          slug: `admin-test-track-reward-${suffix}`,
          title: "Track admin reward",
          description: "demo",
        },
      })
      trackIds.push(track.id)
      const learningModule = await prisma.module.create({
        data: {
          slug: `admin-test-module-reward-${suffix}`,
          title: "Module admin reward",
          description: "demo",
          trackId: track.id,
        },
      })
      moduleIds.push(learningModule.id)
      const activity = await prisma.activity.create({
        data: {
          slug: `admin-test-quiz-reward-${suffix}`,
          title: "Quiz admin reward",
          type: "QUIZ",
          moduleId: learningModule.id,
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
      activityIds.push(activity.id)

      const config = await prisma.rewardConfig.findFirstOrThrow({
        orderBy: { createdAt: "desc" },
      })
      const originalAmount = config.dailyRewardAmount
      const newAmount = originalAmount + 37

      const userBefore = await createTestUser(
        `admin-golden-reward-before-${suffix}@example.com`,
      )
      const beforeClaim = await claimDailyReward(
        userBefore.id,
        activity.id,
        new Date("2026-08-10T05:00:00.000Z"),
      )
      expect(beforeClaim.dailyRewardGranted).toBe(true)
      const beforeReward = await prisma.dailyReward.findFirstOrThrow({
        where: { userId: userBefore.id },
      })
      expect(beforeReward.amount).toBe(originalAmount)

      const updated = await callAsAdminAction(adminHeaders, () =>
        updateRewardConfig(adminUser.id, newAmount),
      )
      expect(updated.dailyRewardAmount).toBe(newAmount)

      // Reward granted before the change is untouched by the change.
      const beforeRewardAfterChange = await prisma.dailyReward.findFirstOrThrow(
        { where: { userId: userBefore.id } },
      )
      expect(beforeRewardAfterChange.amount).toBe(originalAmount)

      const userAfter = await createTestUser(
        `admin-golden-reward-after-${suffix}@example.com`,
      )
      const afterClaim = await claimDailyReward(
        userAfter.id,
        activity.id,
        new Date("2026-08-10T06:00:00.000Z"),
      )
      expect(afterClaim.dailyRewardGranted).toBe(true)
      const afterReward = await prisma.dailyReward.findFirstOrThrow({
        where: { userId: userAfter.id },
      })
      expect(afterReward.amount).toBe(newAmount)

      // Restore the shared config row so other suites/manual runs are unaffected.
      await prisma.rewardConfig.update({
        where: { id: config.id },
        data: { dailyRewardAmount: originalAmount },
      })
    })

    it("changing Voucher.riceCost/active never rewrites an already-created VoucherRedemption's snapshot; a redemption after the change uses the new price/status", async () => {
      const adminEmail = `admin-golden-voucher-${suffix}@example.com`
      await auth.api.signUpEmail({
        body: { name: "Golden Admin Voucher", email: adminEmail, password },
      })
      const adminUser = await prisma.user.findUniqueOrThrow({
        where: { email: adminEmail },
      })
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN" },
      })
      userIds.push(adminUser.id)
      const adminHeaders = await signInAndGetHeaders(adminEmail)

      const voucher = await prisma.voucher.create({
        data: {
          slug: `admin-test-voucher-golden-${suffix}`,
          brand: "Test Brand",
          title: "Test Voucher Golden",
          description: "Voucher demo dùng để kiểm thử.",
          riceCost: 60,
        },
      })
      voucherIds.push(voucher.id)

      async function grantBalance(userId: string, amount: number) {
        await prisma.riceLedgerEntry.create({
          data: {
            userId,
            amount,
            entryType: "DAILY_REWARD",
            referenceId: `test-grant-${randomUUID()}`,
          },
        })
        await prisma.riceBalance.upsert({
          where: { userId },
          create: { userId, balance: amount },
          update: { balance: { increment: amount } },
        })
      }

      const userBefore = await createTestUser(
        `admin-golden-voucher-before-${suffix}@example.com`,
      )
      await grantBalance(userBefore.id, 100)
      const redeemedBefore = await redeemVoucher(
        userBefore.id,
        voucher.slug,
        randomUUID(),
      )
      expect(redeemedBefore.status).toBe("redeemed")
      if (redeemedBefore.status !== "redeemed") throw new Error("unreachable")
      expect(redeemedBefore.redemption.riceCostSnapshot).toBe(60)

      const updated = await callAsAdminAction(adminHeaders, () =>
        updateVoucher(adminUser.id, voucher.id, { riceCost: 90 }),
      )
      expect(updated.riceCost).toBe(90)

      // Old redemption snapshot is untouched by the price change.
      const oldRedemption = await prisma.voucherRedemption.findUniqueOrThrow({
        where: { id: redeemedBefore.redemption.id },
      })
      expect(oldRedemption.riceCostSnapshot).toBe(60)

      const userAfter = await createTestUser(
        `admin-golden-voucher-after-${suffix}@example.com`,
      )
      await grantBalance(userAfter.id, 100)
      const redeemedAfter = await redeemVoucher(
        userAfter.id,
        voucher.slug,
        randomUUID(),
      )
      expect(redeemedAfter.status).toBe("redeemed")
      if (redeemedAfter.status !== "redeemed") throw new Error("unreachable")
      expect(redeemedAfter.redemption.riceCostSnapshot).toBe(90)

      // Deactivating the voucher blocks any further redemption immediately.
      await callAsAdminAction(adminHeaders, () =>
        updateVoucher(adminUser.id, voucher.id, { active: false }),
      )
      const userDeactivated = await createTestUser(
        `admin-golden-voucher-deactivated-${suffix}@example.com`,
      )
      await grantBalance(userDeactivated.id, 100)
      const deactivatedResult = await redeemVoucher(
        userDeactivated.id,
        voucher.slug,
        randomUUID(),
      )
      expect(deactivatedResult.status).toBe("voucher_unavailable")
    })

    it("changing Track/Module/Activity active/sortOrder is reflected immediately in the USER-facing catalog", async () => {
      const adminEmail = `admin-golden-content-${suffix}@example.com`
      await auth.api.signUpEmail({
        body: { name: "Golden Admin Content", email: adminEmail, password },
      })
      const adminUser = await prisma.user.findUniqueOrThrow({
        where: { email: adminEmail },
      })
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN" },
      })
      userIds.push(adminUser.id)
      const adminHeaders = await signInAndGetHeaders(adminEmail)

      // Sort orders far above the seeded catalog's (0/1/2) so reordering these
      // two test tracks relative to each other can never collide/tie with
      // real seed data and become non-deterministic.
      const trackA = await prisma.track.create({
        data: {
          slug: `admin-test-track-content-a-${suffix}`,
          title: "Track content A",
          description: "demo",
          sortOrder: 1000,
        },
      })
      trackIds.push(trackA.id)
      const trackB = await prisma.track.create({
        data: {
          slug: `admin-test-track-content-b-${suffix}`,
          title: "Track content B",
          description: "demo",
          sortOrder: 2000,
        },
      })
      trackIds.push(trackB.id)

      const learningModule = await prisma.module.create({
        data: {
          slug: `admin-test-module-content-${suffix}`,
          title: "Module content",
          description: "demo",
          trackId: trackB.id,
        },
      })
      moduleIds.push(learningModule.id)

      // Sanity: both tracks visible before any admin change, A before B.
      const catalogBefore = await listActiveTracks()
      const slugsBefore = catalogBefore
        .filter((t) => t.slug === trackA.slug || t.slug === trackB.slug)
        .map((t) => t.slug)
      expect(slugsBefore).toEqual([trackA.slug, trackB.slug])

      // Reorder B before A.
      await callAsAdminAction(adminHeaders, () =>
        updateTrackStatus(adminUser.id, trackB.id, { sortOrder: 999 }),
      )

      const catalogReordered = await listActiveTracks()
      const slugsReordered = catalogReordered
        .filter((t) => t.slug === trackA.slug || t.slug === trackB.slug)
        .map((t) => t.slug)
      expect(slugsReordered).toEqual([trackB.slug, trackA.slug])

      // Deactivate track A — it must disappear from the catalog immediately.
      await callAsAdminAction(adminHeaders, () =>
        updateTrackStatus(adminUser.id, trackA.id, { active: false }),
      )

      const catalogAfter = await listActiveTracks()
      const slugsAfter = catalogAfter
        .filter((t) => t.slug === trackA.slug || t.slug === trackB.slug)
        .map((t) => t.slug)
      expect(slugsAfter).toEqual([trackB.slug])

      const trackADetail = await getTrackDetail(trackA.slug)
      expect(trackADetail).toBeNull()

      // Deactivating the module hides it (and would hide its activities) from
      // an otherwise-active track's detail view.
      await callAsAdminAction(adminHeaders, () =>
        updateModuleStatus(adminUser.id, learningModule.id, { active: false }),
      )
      const trackBDetail = await getTrackDetail(trackB.slug)
      expect(
        trackBDetail?.modules.some((m) => m.id === learningModule.id),
      ).toBe(false)
    })
  })
})
