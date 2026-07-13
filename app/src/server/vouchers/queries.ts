import { prisma } from "@/server/db"

export type VoucherCatalogItem = {
  slug: string
  brand: string
  title: string
  description: string
  riceCost: number
  imageUrl: string
}

/**
 * Active mock-voucher catalog, ordered cheapest-first. Read-only — price is
 * always the current `Voucher.riceCost`; a redemption snapshots this value
 * at redeem time (see `redeemVoucher`), so this list never affects past
 * history.
 */
export async function listActiveVouchers(): Promise<VoucherCatalogItem[]> {
  const vouchers = await prisma.voucher.findMany({
    where: { active: true },
    orderBy: { riceCost: "asc" },
  })

  return vouchers.map((voucher) => ({
    slug: voucher.slug,
    brand: voucher.brand,
    title: voucher.title,
    description: voucher.description,
    riceCost: voucher.riceCost,
    imageUrl: voucher.imageUrl,
  }))
}

export type VoucherRedemptionHistoryItem = {
  id: string
  voucherBrandSnapshot: string
  voucherTitleSnapshot: string
  riceCostSnapshot: number
  createdAt: string
}

/**
 * A user's redemption history, newest first. Reads only the snapshot fields
 * on `VoucherRedemption` — never the current `Voucher` row — so it stays
 * accurate even after a voucher's price/title changes or it is deactivated.
 */
export async function getVoucherRedemptionHistory(
  userId: string,
  limit = 20,
): Promise<VoucherRedemptionHistoryItem[]> {
  const redemptions = await prisma.voucherRedemption.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return redemptions.map((redemption) => ({
    id: redemption.id,
    voucherBrandSnapshot: redemption.voucherBrandSnapshot,
    voucherTitleSnapshot: redemption.voucherTitleSnapshot,
    riceCostSnapshot: redemption.riceCostSnapshot,
    createdAt: redemption.createdAt.toISOString(),
  }))
}
