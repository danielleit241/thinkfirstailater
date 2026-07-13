/**
 * Mock voucher catalog seed. A wider demo catalog across everyday reward
 * categories — every `description` still explicitly labelled as mock/demo,
 * no real voucher codes, no partner integration. Idempotent: `upsert`-ed by
 * the stable `slug`, same pattern as `seedLearningCatalog`/
 * `seedRewardConfig` — running this repeatedly never creates duplicates.
 *
 * `imageUrl` is always synced on re-seed (it's a display-only asset path, not
 * something admin edits), while `riceCost`/`active` are left alone on update
 * so an admin's price/status change is never reset by re-running the seed.
 */
import { prisma } from "@/server/db"

type VoucherSeed = {
  slug: string
  brand: string
  title: string
  description: string
  riceCost: number
  imageUrl: string
}

const DEMO_NOTE =
  "Voucher trình diễn  — không phải mã thật, không thể sử dụng tại cửa hàng."

const VOUCHER_SEEDS: VoucherSeed[] = [
  {
    slug: "think-first-welcome-demo",
    brand: "Think First",
    title: "Voucher chào mừng người học ",
    description:
      "Voucher trình diễn dành cho hành trình đầu tiên — không có giá trị quy đổi thật.",
    riceCost: 10,
    imageUrl: "/vouchers/gift.svg",
  },
  {
    slug: "trung-nguyen-legend-demo",
    brand: "Trung Nguyên Legend",
    title: "Voucher cà phê Trung Nguyên Legend ",
    description: DEMO_NOTE,
    riceCost: 80,
    imageUrl: "/vouchers/coffee.svg",
  },
  {
    slug: "the-coffee-house-demo",
    brand: "The Coffee House",
    title: "Voucher đồ uống The Coffee House ",
    description: DEMO_NOTE,
    riceCost: 85,
    imageUrl: "/vouchers/coffee.svg",
  },
  {
    slug: "highlands-coffee-demo",
    brand: "Highlands Coffee",
    title: "Voucher đồ uống Highlands Coffee ",
    description: DEMO_NOTE,
    riceCost: 90,
    imageUrl: "/vouchers/coffee.svg",
  },
  {
    slug: "toco-toco-demo",
    brand: "ToCoToCo",
    title: "Voucher trà sữa ToCoToCo ",
    description: DEMO_NOTE,
    riceCost: 95,
    imageUrl: "/vouchers/milktea.svg",
  },
  {
    slug: "thien-long-stationery-demo",
    brand: "Thiên Long",
    title: "Bộ văn phòng phẩm Thiên Long ",
    description: DEMO_NOTE,
    riceCost: 70,
    imageUrl: "/vouchers/stationery.svg",
  },
  {
    slug: "abc-bakery-demo",
    brand: "ABC Bakery",
    title: "Voucher bánh ngọt ABC Bakery ",
    description: DEMO_NOTE,
    riceCost: 100,
    imageUrl: "/vouchers/bakery.svg",
  },
  {
    slug: "gong-cha-demo",
    brand: "Gong Cha",
    title: "Voucher trà sữa Gong Cha ",
    description: DEMO_NOTE,
    riceCost: 110,
    imageUrl: "/vouchers/milktea.svg",
  },
  {
    slug: "be-ride-demo",
    brand: "Be",
    title: "Mã giảm giá chuyến xe Be ",
    description: DEMO_NOTE,
    riceCost: 110,
    imageUrl: "/vouchers/ride.svg",
  },
  {
    slug: "koi-the-demo",
    brand: "Koi Thé",
    title: "Voucher trà sữa Koi Thé ",
    description: DEMO_NOTE,
    riceCost: 120,
    imageUrl: "/vouchers/milktea.svg",
  },
  {
    slug: "grab-ride-demo",
    brand: "Grab",
    title: "Mã giảm giá chuyến xe Grab ",
    description: DEMO_NOTE,
    riceCost: 130,
    imageUrl: "/vouchers/ride.svg",
  },
  {
    slug: "phuc-long-demo",
    brand: "Phúc Long",
    title: "Voucher trà/cà phê Phúc Long ",
    description: DEMO_NOTE,
    riceCost: 130,
    imageUrl: "/vouchers/milktea.svg",
  },
  {
    slug: "tous-les-jours-demo",
    brand: "Tous Les Jours",
    title: "Voucher bánh ngọt Tous Les Jours ",
    description: DEMO_NOTE,
    riceCost: 140,
    imageUrl: "/vouchers/bakery.svg",
  },
  {
    slug: "viettel-topup-demo",
    brand: "Viettel",
    title: "Mã nạp tiền điện thoại Viettel ",
    description: DEMO_NOTE,
    riceCost: 150,
    imageUrl: "/vouchers/topup.svg",
  },
  {
    slug: "mobifone-topup-demo",
    brand: "MobiFone",
    title: "Mã nạp tiền điện thoại MobiFone ",
    description: DEMO_NOTE,
    riceCost: 150,
    imageUrl: "/vouchers/topup.svg",
  },
  {
    slug: "fahasa-books-demo",
    brand: "Fahasa",
    title: "Phiếu mua sách Fahasa ",
    description: DEMO_NOTE,
    riceCost: 160,
    imageUrl: "/vouchers/bookstore.svg",
  },
  {
    slug: "lotte-cinema-demo",
    brand: "Lotte Cinema",
    title: "Vé xem phim Lotte Cinema ",
    description: DEMO_NOTE,
    riceCost: 170,
    imageUrl: "/vouchers/cinema.svg",
  },
  {
    slug: "cgv-cinema-demo",
    brand: "CGV Cinema",
    title: "Vé xem phim CGV ",
    description: DEMO_NOTE,
    riceCost: 180,
    imageUrl: "/vouchers/cinema.svg",
  },
  {
    slug: "tiki-shopping-demo",
    brand: "Tiki",
    title: "Phiếu mua sắm Tiki ",
    description: DEMO_NOTE,
    riceCost: 220,
    imageUrl: "/vouchers/bookstore.svg",
  },
  {
    slug: "momo-cashback-demo",
    brand: "MoMo",
    title: "Mã hoàn tiền ví MoMo ",
    description: DEMO_NOTE,
    riceCost: 200,
    imageUrl: "/vouchers/ewallet.svg",
  },
  {
    slug: "zalopay-cashback-demo",
    brand: "ZaloPay",
    title: "Mã hoàn tiền ví ZaloPay ",
    description: DEMO_NOTE,
    riceCost: 200,
    imageUrl: "/vouchers/ewallet.svg",
  },
  {
    slug: "winmart-shopping-demo",
    brand: "WinMart",
    title: "Phiếu mua sắm WinMart ",
    description: DEMO_NOTE,
    riceCost: 250,
    imageUrl: "/vouchers/grocery.svg",
  },
  {
    slug: "california-fitness-demo",
    brand: "California Fitness",
    title: "Buổi tập thử California Fitness ",
    description: DEMO_NOTE,
    riceCost: 350,
    imageUrl: "/vouchers/wellness.svg",
  },
  {
    slug: "think-first-advanced-track-demo",
    brand: "Think First",
    title: "Mở khoá chủ đề nâng cao ",
    description:
      "Voucher trình diễn mở một chủ đề mở rộng — không phải giao dịch thật, chỉ minh hoạ phần thưởng bậc cao.",
    riceCost: 500,
    imageUrl: "/vouchers/course.svg",
  },
]

export async function seedVouchers() {
  return Promise.all(
    VOUCHER_SEEDS.map((voucher) =>
      // `update` only ever syncs `imageUrl` — a display-only asset path — so
      // re-running the seed never resets a `riceCost`/`active` value an admin
      // (Phase 8) may have already changed on an existing slug.
      prisma.voucher.upsert({
        where: { slug: voucher.slug },
        create: voucher,
        update: { imageUrl: voucher.imageUrl },
      }),
    ),
  )
}
