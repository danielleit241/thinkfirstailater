import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"

import { prisma } from "@/server/db"
import { redeemVoucher } from "@/server/vouchers/service"

// Real Postgres from Docker Compose (`docker compose up -d` at repo root) —
// no mocking. Covers the highest-risk invariants for redemption: the
// balance-check-and-debit must happen in one transaction (no TOCTOU),
// idempotency is enforced by the DB unique constraint (not in-memory), and
// two concurrent redemptions for the same user can never both succeed when
// only one can be afforded. Same pattern as
// `src/server/__tests__/rewards.integration.test.ts`.
describe("vouchers: redemption ledger and idempotency", () => {
  const suffix = randomUUID()
  const userIds: string[] = []
  const voucherIds: string[] = []

  function createTestUser(email: string) {
    return prisma.user.create({
      data: { id: randomUUID(), name: "Voucher Test User", email },
    })
  }

  function createTestVoucher(slug: string, riceCost: number, active = true) {
    return prisma.voucher
      .create({
        data: {
          slug,
          brand: "Test Brand",
          title: "Test Voucher",
          description: "Voucher demo dùng để kiểm thử.",
          riceCost,
          active,
        },
      })
      .then((voucher) => {
        voucherIds.push(voucher.id)
        return voucher
      })
  }

  async function grantBalance(userId: string, amount: number) {
    // Also write a matching `RiceLedgerEntry` (as `claimDailyReward` would)
    // so the ledger-sum-equals-balance reconciliation invariant checked
    // below is meaningful, not an artifact of a balance set out-of-band.
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

  afterAll(async () => {
    await prisma.voucherRedemption.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.riceLedgerEntry.deleteMany({
      where: { userId: { in: userIds } },
    })
    await prisma.riceBalance.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.voucher.deleteMany({ where: { id: { in: voucherIds } } })
    await prisma.$disconnect()
  })

  it("redeems successfully: debits the exact riceCost, creates one redemption + one ledger entry", async () => {
    const user = await createTestUser(`vouchers-success-${suffix}@example.com`)
    userIds.push(user.id)
    await grantBalance(user.id, 100)

    const voucher = await createTestVoucher(
      `test-voucher-success-${suffix}`,
      60,
    )

    const result = await redeemVoucher(user.id, voucher.slug, randomUUID())

    expect(result.status).toBe("redeemed")
    if (result.status !== "redeemed") throw new Error("unreachable")
    expect(result.balance).toBe(40)
    expect(result.redemption.riceCostSnapshot).toBe(60)

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(1)

    const ledgerEntries = await prisma.riceLedgerEntry.findMany({
      where: { userId: user.id, entryType: "VOUCHER_REDEMPTION" },
    })
    expect(ledgerEntries).toHaveLength(1)
    expect(ledgerEntries[0]!.amount).toBe(-60)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(40)
  })

  it("retrying the same idempotencyKey does not debit twice and returns the same redemption", async () => {
    const user = await createTestUser(`vouchers-retry-${suffix}@example.com`)
    userIds.push(user.id)
    await grantBalance(user.id, 100)

    const voucher = await createTestVoucher(`test-voucher-retry-${suffix}`, 30)
    const idempotencyKey = randomUUID()

    const first = await redeemVoucher(user.id, voucher.slug, idempotencyKey)
    const second = await redeemVoucher(user.id, voucher.slug, idempotencyKey)

    expect(first.status).toBe("redeemed")
    expect(second.status).toBe("already_redeemed")
    if (first.status !== "redeemed" || second.status !== "already_redeemed") {
      throw new Error("unreachable")
    }
    expect(second.redemption.id).toBe(first.redemption.id)

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(1)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(70)
  })

  it("rejects a redemption when the balance is insufficient, with no side effects", async () => {
    const user = await createTestUser(
      `vouchers-insufficient-${suffix}@example.com`,
    )
    userIds.push(user.id)
    await grantBalance(user.id, 10)

    const voucher = await createTestVoucher(
      `test-voucher-insufficient-${suffix}`,
      50,
    )

    const result = await redeemVoucher(user.id, voucher.slug, randomUUID())

    expect(result.status).toBe("insufficient_balance")

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(0)

    const ledgerCount = await prisma.riceLedgerEntry.count({
      where: { userId: user.id, entryType: "VOUCHER_REDEMPTION" },
    })
    expect(ledgerCount).toBe(0)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(10)
  })

  it("rejects redemption of an inactive or nonexistent voucher, with no side effects", async () => {
    const user = await createTestUser(`vouchers-inactive-${suffix}@example.com`)
    userIds.push(user.id)
    await grantBalance(user.id, 1000)

    const inactiveVoucher = await createTestVoucher(
      `test-voucher-inactive-${suffix}`,
      10,
      false,
    )

    const inactiveResult = await redeemVoucher(
      user.id,
      inactiveVoucher.slug,
      randomUUID(),
    )
    expect(inactiveResult.status).toBe("voucher_unavailable")

    const missingResult = await redeemVoucher(
      user.id,
      `test-voucher-nonexistent-${suffix}`,
      randomUUID(),
    )
    expect(missingResult.status).toBe("voucher_unavailable")

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(0)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(1000)
  })

  it("ten concurrent redemptions for the same user, affordable for only one, result in exactly one success and a non-negative reconciled balance", async () => {
    // A 2-way race can pass "by timing luck" even when the balance check and
    // the debit are not truly atomic (READ COMMITTED lets two transactions
    // both read the same pre-debit balance if they happen to interleave just
    // right). 10-way fan-out reliably exercises the race window and is what
    // actually caught a real double-spend bug during development — do not
    // shrink this back down to 2.
    const user = await createTestUser(
      `vouchers-concurrency-${suffix}@example.com`,
    )
    userIds.push(user.id)
    await grantBalance(user.id, 100)

    const voucher = await createTestVoucher(
      `test-voucher-concurrency-${suffix}`,
      100,
    )

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        redeemVoucher(user.id, voucher.slug, randomUUID()),
      ),
    )

    const redeemedCount = results.filter((r) => r.status === "redeemed").length
    const insufficientCount = results.filter(
      (r) => r.status === "insufficient_balance",
    ).length
    expect(redeemedCount).toBe(1)
    expect(insufficientCount).toBe(9)

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(1)

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
    expect(balance?.balance).toBeGreaterThanOrEqual(0)
    expect(balance?.balance).toBe(0)
  })

  it("two concurrent redemptions with the same idempotencyKey (double-submit) produce exactly one side effect", async () => {
    const user = await createTestUser(
      `vouchers-double-submit-${suffix}@example.com`,
    )
    userIds.push(user.id)
    await grantBalance(user.id, 100)

    const voucher = await createTestVoucher(
      `test-voucher-double-submit-${suffix}`,
      40,
    )
    const idempotencyKey = randomUUID()

    const [resultA, resultB] = await Promise.all([
      redeemVoucher(user.id, voucher.slug, idempotencyKey),
      redeemVoucher(user.id, voucher.slug, idempotencyKey),
    ])

    const statuses = [resultA.status, resultB.status].sort()
    expect(statuses).toEqual(["already_redeemed", "redeemed"])

    const redemptionCount = await prisma.voucherRedemption.count({
      where: { userId: user.id },
    })
    expect(redemptionCount).toBe(1)

    const ledgerCount = await prisma.riceLedgerEntry.count({
      where: { userId: user.id, entryType: "VOUCHER_REDEMPTION" },
    })
    expect(ledgerCount).toBe(1)

    const balance = await prisma.riceBalance.findUnique({
      where: { userId: user.id },
    })
    expect(balance?.balance).toBe(60)
  })
})
