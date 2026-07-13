import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"

import {
  createE2eTestVoucher,
  deleteTestUserByEmail,
  deleteTestVoucher,
  getRewardConfigAmount,
} from "./db-helpers"

/**
 * Golden flow #1 (User, ≤5 phút): đăng ký → hoàn thành 1 activity → nhận
 * lúa → đổi 1 voucher.
 *
 * Ghi chú quan trọng: mức thưởng thật (`dailyRewardAmount`, mặc định 10 —
 * xem `src/server/rewards/seed-data.ts`) chỉ đủ mua voucher rẻ nhất trong
 * seed thật (100 lúa) sau nhiều ngày tích luỹ, không thể trong một phiên
 * test. Vì "nhận lúa" và "đổi voucher" là 2 việc cần kiểm chứng độc lập
 * (không phải giá voucher thật), test tạo một voucher demo riêng cho E2E với
 * `riceCost` đúng bằng `dailyRewardAmount` hiện hành — user vẫn phải nhận đủ
 * lúa thật qua UI mới đổi được, không có gì bị giả lập ở phần đang kiểm
 * chứng. Mọi bước còn lại (đăng ký, hoàn thành activity, đổi voucher) đều đi
 * qua UI thật.
 */
test.describe("Golden flow: User", () => {
  // Request thật từ Chromium không tự set `x-forwarded-for` (không có proxy
  // phía trước), nên `clientKey()` trong route handler auth fallback về
  // "unknown" — mọi lần đăng ký (mọi project, mọi lần chạy lại) sẽ dùng
  // chung 1 bucket rate-limit register (5/60s, xem `rate-limit.ts`) và có
  // thể lẫn nhau, gây fail giả (không phải bug sản phẩm). Gán một giá trị
  // ngẫu nhiên riêng cho mỗi lần chạy spec này để có bucket rate-limit độc
  // lập — dùng đúng tính chất "client tự set header này" đã được ghi nhận
  // là accepted limitation ở Phase 3, không đổi code sản phẩm.
  //
  // Dùng `beforeEach` + `setExtraHTTPHeaders` thay vì `test.use()`: module
  // spec chỉ được load (và `randomUUID()` chỉ chạy) một lần cho cả 2 project
  // desktop/mobile, nên `test.use()` ở đây sẽ khiến 2 project dùng chung một
  // giá trị — vẫn đụng chung bucket. `beforeEach` chạy lại mỗi lần test thực
  // thi (mỗi project một lần) nên mỗi lần có giá trị ngẫu nhiên riêng.
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": randomUUID() })
  })

  const email = `e2e-user-golden-${randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"
  const name = "Người dùng E2E"

  let testVoucherId: string
  let testVoucherRiceCost: number

  test.beforeAll(async () => {
    testVoucherRiceCost = await getRewardConfigAmount()
    const voucher = await createE2eTestVoucher(testVoucherRiceCost)
    testVoucherId = voucher.id
  })

  test.afterAll(async () => {
    await deleteTestUserByEmail(email)
    await deleteTestVoucher(testVoucherId)
  })

  test("đăng ký, hoàn thành 1 hoạt động, nhận lúa, và đổi 1 voucher", async ({
    page,
  }) => {
    // 1. Đăng ký tài khoản mới.
    await page.goto("/register")
    await page.getByLabel("Họ và tên").fill(name)
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Mật khẩu").fill(password)
    await page.getByRole("button", { name: "Đăng ký" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole("heading", { name: `Chào mừng trở lại, ${name}` }),
    ).toBeVisible()
    await expect(page.getByText("Số lúa hiện có")).toBeVisible()

    // 2. Vào lộ trình học, chọn hoạt động CHECKLIST dễ hoàn thành nhất
    // (không cần biết đáp án đúng như QUIZ — chỉ cần tự đánh giá đủ mục).
    await page.goto("/catalog")
    await page
      .getByRole("link", { name: "Đặt câu hỏi tốt", exact: false })
      .click()
    await expect(
      page.getByRole("heading", { name: "Đặt câu hỏi tốt" }),
    ).toBeVisible()
    await page
      .getByRole("link", { name: "Tự đánh giá trước khi hỏi AI" })
      .click()

    await expect(
      page.getByRole("heading", { name: "Tự đánh giá trước khi hỏi AI" }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Tôi hiểu đề bài" }).click()
    await page.getByRole("button", { name: "Tôi đã có giả thuyết" }).click()
    await page.getByRole("button", { name: "Tôi biết cần hỏi gì" }).click()
    await page.getByRole("button", { name: "Xác nhận hoàn thành" }).click()

    await expect(
      page.getByText("Bạn đã hoàn thành hoạt động này."),
    ).toBeVisible()

    // 3. Xác nhận đã nhận lúa trên dashboard.
    await page.goto("/dashboard")
    await expect(
      page.getByText(String(testVoucherRiceCost), { exact: true }),
    ).toBeVisible()

    // 4. Đổi voucher demo dành riêng cho test (giá đúng bằng số lúa vừa nhận).
    await page.goto("/vouchers")
    const voucherCard = page
      .locator("div.rounded-2xl")
      .filter({ hasText: "Voucher kiểm thử E2E (demo)" })
    await expect(voucherCard).toHaveCount(1)
    await voucherCard.getByRole("button", { name: "Đổi voucher" }).click()
    await expect(voucherCard.getByText("Đã đổi thành công.")).toBeVisible()

    // 5. Xác nhận lịch sử đổi voucher ghi nhận đúng giao dịch.
    await page.goto("/vouchers/history")
    await expect(
      page.getByText("E2E Test Brand — Voucher kiểm thử E2E (demo)"),
    ).toBeVisible()
  })
})
