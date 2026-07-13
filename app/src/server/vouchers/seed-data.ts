/**
 * Mock voucher catalog seed. Four demo vouchers with different
 * `riceCost` — explicitly labelled as mock/demo in `description`, no real
 * voucher codes. Idempotent: `upsert`-ed by the stable `slug`, same pattern
 * as `seedLearningCatalog`/`seedRewardConfig` — running this repeatedly
 * never creates duplicates and never resets a price/status an admin
 * (Phase 8) may have already changed.
 */
import { prisma } from "@/server/db"

type VoucherSeed = {
  slug: string
  brand: string
  title: string
  description: string
  riceCost: number
}

const VOUCHER_SEEDS: VoucherSeed[] = [
  {
    slug: "think-first-welcome-demo",
    brand: "Think First",
    title: "Voucher chào mừng người học (demo)",
    description:
      "Voucher trình diễn dành cho hành trình đầu tiên — không có giá trị quy đổi thật.",
    riceCost: 10,
  },
  {
    slug: "highlands-coffee-demo",
    brand: "Highlands Coffee",
    title: "Voucher đồ uống Highlands Coffee (demo)",
    description:
      "Voucher trình diễn (demo) — không phải mã thật, không thể sử dụng tại cửa hàng.",
    riceCost: 100,
  },
  {
    slug: "koi-the-demo",
    brand: "Koi Thé",
    title: "Voucher trà sữa Koi Thé (demo)",
    description:
      "Voucher trình diễn (demo) — không phải mã thật, không thể sử dụng tại cửa hàng.",
    riceCost: 150,
  },
  {
    slug: "phuc-long-demo",
    brand: "Phúc Long",
    title: "Voucher trà/cà phê Phúc Long (demo)",
    description:
      "Voucher trình diễn (demo) — không phải mã thật, không thể sử dụng tại cửa hàng.",
    riceCost: 200,
  },
]

export async function seedVouchers() {
  return Promise.all(
    VOUCHER_SEEDS.map((voucher) =>
      // `update: {}` is intentional: once a voucher row exists, re-running the
      // seed must never overwrite a price/status an admin (Phase 8) may have
      // already changed — only a genuinely missing slug gets created.
      prisma.voucher.upsert({
        where: { slug: voucher.slug },
        create: voucher,
        update: {},
      }),
    ),
  )
}
