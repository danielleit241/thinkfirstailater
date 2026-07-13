import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { History, Sprout } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toSafeUser } from "@/server/auth/guards"
import { requireSessionForPage } from "@/server/auth/page-guards"
import { getRewardSummary } from "@/server/rewards/queries"
import {
  listActiveVouchers,
  type VoucherCatalogItem,
} from "@/server/vouchers/queries"

import { VoucherRedeemButton } from "./voucher-redeem-button"

export const metadata: Metadata = {
  title: "Đổi quà",
}

/**
 * Fixed focal voucher for the page: the biggest reward the learner can claim
 * right now, or — if nothing is affordable yet — the one closest within
 * reach. Mirrors the dashboard's "next task" card so every page has exactly
 * one highlighted next action instead of a flat grid.
 */
function pickFeaturedVoucher(
  vouchers: VoucherCatalogItem[],
  balance: number,
) {
  const affordable = vouchers.filter((voucher) => voucher.riceCost <= balance)
  if (affordable.length > 0) {
    return {
      voucher: affordable.reduce((best, voucher) =>
        voucher.riceCost > best.riceCost ? voucher : best,
      ),
      reason: "affordable" as const,
    }
  }

  if (vouchers.length === 0) return null

  return {
    voucher: vouchers.reduce((closest, voucher) =>
      voucher.riceCost - balance < closest.riceCost - balance
        ? voucher
        : closest,
    ),
    reason: "closest" as const,
  }
}

export default async function VouchersPage() {
  const session = await requireSessionForPage()
  const user = toSafeUser(session.user)
  const [vouchers, reward] = await Promise.all([
    listActiveVouchers(),
    getRewardSummary(user.id),
  ])

  const featured = pickFeaturedVoucher(vouchers, reward.balance)
  const restVouchers = featured
    ? vouchers.filter((voucher) => voucher.slug !== featured.voucher.slug)
    : vouchers

  return (
    <div className="grid gap-8">
      <header className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-[var(--leaf)]">
            Đổi quà
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] md:text-5xl">
            Dùng lúa để khép lại một vòng học.
          </h1>
          <p className="mt-4 leading-7 text-[var(--ink-muted)]">
            Tất cả quà bên dưới chỉ dùng để trình diễn, không phải voucher hoặc
            mã giảm giá có giá trị thật.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--harvest-soft)] px-5 py-4 text-[var(--sunrise-ink)]">
          <Sprout aria-hidden="true" />
          <span>
            <small className="block text-xs font-semibold">Lúa hiện có</small>
            <strong className="text-2xl">{reward.balance}</strong>
          </span>
        </div>
      </header>

      {vouchers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-bold">Chưa có quà đang mở</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Bạn vẫn có thể tiếp tục học và tích lúa trong lúc chờ quà mới.
          </p>
          <Link className={`${buttonVariants()} mt-5`} href="/catalog">
            Tiếp tục học
          </Link>
        </div>
      ) : (
        <>
          {featured ? (
            <section
              className="grid gap-0 overflow-hidden rounded-[16px_16px_16px_4px] border border-[var(--line)] bg-white md:grid-cols-[20rem_1fr]"
              aria-labelledby="featured-voucher-title"
            >
              <div className="relative h-44 md:h-full">
                <Image
                  src={featured.voucher.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 20rem"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col p-6 md:p-8">
                <span className="w-fit rounded-full bg-[var(--seedling-soft)] px-3 py-1 text-xs font-bold text-[var(--leaf)]">
                  {featured.reason === "affordable"
                    ? "Đổi được ngay — phần thưởng lớn nhất trong tầm tay"
                    : "Gần đổi được nhất"}
                </span>
                <p className="mt-5 text-xs font-bold tracking-[0.08em] text-[var(--sunrise-ink)] uppercase">
                  {featured.voucher.brand}
                </p>
                <h2
                  id="featured-voucher-title"
                  className="mt-2 text-2xl font-bold tracking-[-0.035em] md:text-3xl"
                >
                  {featured.voucher.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-muted)]">
                  {featured.voucher.description}
                </p>
                <p className="mt-6 text-lg font-bold text-[var(--sunrise-ink)]">
                  {featured.voucher.riceCost} lúa
                </p>
                <div className="max-w-xs">
                  <VoucherRedeemButton
                    voucherSlug={featured.voucher.slug}
                    voucherTitle={featured.voucher.title}
                    riceCost={featured.voucher.riceCost}
                    canAfford={featured.reason === "affordable"}
                    missingRice={Math.max(
                      featured.voucher.riceCost - reward.balance,
                      0,
                    )}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {restVouchers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restVouchers.map((voucher) => {
                const missingRice = Math.max(
                  voucher.riceCost - reward.balance,
                  0,
                )
                const canAfford = missingRice === 0

                return (
                  <article
                    key={voucher.slug}
                    className="flex min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
                  >
                    <div className="relative h-36 w-full">
                      <Image
                        src={voucher.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold tracking-[0.08em] text-[var(--leaf)] uppercase">
                          {voucher.brand}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${canAfford ? "bg-[var(--seedling-soft)] text-[var(--leaf)]" : "bg-[var(--mist)] text-[var(--ink-muted)]"}`}
                        >
                          {canAfford ? "Đổi ngay" : `Cần thêm ${missingRice} lúa`}
                        </span>
                      </div>
                      <h2 className="mt-5 text-xl font-bold tracking-[-0.035em]">
                        {voucher.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                        {voucher.description}
                      </p>
                      <p className="mt-auto pt-6 text-lg font-bold text-[var(--sunrise-ink)]">
                        {voucher.riceCost} lúa
                      </p>
                      <VoucherRedeemButton
                        voucherSlug={voucher.slug}
                        voucherTitle={voucher.title}
                        riceCost={voucher.riceCost}
                        canAfford={canAfford}
                        missingRice={missingRice}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
        </>
      )}

      <Link
        href="/vouchers/history"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-[var(--leaf)] underline-offset-4 hover:underline"
      >
        <History size={17} aria-hidden="true" /> Xem lịch sử đổi quà
      </Link>
    </div>
  )
}
