import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"

import {
  deleteTestUserByEmail,
  getRewardConfigAmount,
  promoteToAdminByEmail,
  setRewardConfigAmount,
} from "./db-helpers"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173"

/**
 * Golden flow #2 (Admin): đăng nhập bằng tài khoản ADMIN → vào `/admin` →
 * đổi `dailyRewardAmount` → xác nhận UI phản ánh giá trị mới sau khi tải
 * lại trang (không chỉ echo lại state cục bộ của input đã gõ).
 *
 * Tạo tài khoản ADMIN cùng cách `scripts/admin-bootstrap.ts` làm về mặt bản
 * chất — đăng ký qua đúng endpoint Better Auth thật (`POST
 * /api/auth/sign-up/email`, để mật khẩu được hash đúng như mọi user khác),
 * rồi promote `role` sang `ADMIN` bằng SQL trực tiếp — không tạo hàng
 * `user`/`account` thủ công vì sẽ không đăng nhập được. Gọi thẳng endpoint
 * HTTP thay vì import `@/server/auth` trong tiến trình Playwright: module
 * Prisma Client sinh ra là ESM thuần (`import.meta`), không tương thích với
 * cách Playwright Test tự biên dịch/nạp file TS của nó — xem chú thích ở
 * `./db-helpers.ts`.
 */
test.describe("Golden flow: Admin", () => {
  const email = `e2e-admin-golden-${randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"
  const name = "Admin E2E"

  let originalDailyRewardAmount: number

  test.beforeAll(async () => {
    originalDailyRewardAmount = await getRewardConfigAmount()

    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      // Better Auth chặn request thiếu header Origin (kiểm tra CSRF) — gọi
      // trực tiếp từ tiến trình Node của Playwright (không qua browser) không
      // tự có header này như request phát ra từ một trang thật.
      // `x-forwarded-for` ngẫu nhiên: tránh dùng chung bucket rate-limit
      // register ("unknown", xem `rate-limit.ts`) với các lần chạy khác của
      // suite E2E — không phải bug sản phẩm, chỉ là cô lập test.
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": randomUUID(),
      },
      body: JSON.stringify({ name, email, password }),
    })
    if (!response.ok) {
      throw new Error(
        `Không tạo được tài khoản ADMIN test qua sign-up API: ${response.status} ${await response.text()}`,
      )
    }

    await promoteToAdminByEmail(email)
  })

  test.afterAll(async () => {
    await setRewardConfigAmount(originalDailyRewardAmount)
    await deleteTestUserByEmail(email)
  })

  test("đăng nhập ADMIN, đổi lúa thưởng hàng ngày, xác nhận UI phản ánh giá trị mới", async ({
    page,
  }) => {
    // 1. Đăng nhập bằng tài khoản ADMIN.
    await page.goto("/login")
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Mật khẩu").fill(password)
    await page.getByRole("button", { name: "Đăng nhập" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText("ADMIN", { exact: true })).toBeVisible()

    // 2. Vào khu vực quản trị.
    await page.getByRole("link", { name: "Đi tới khu vực quản trị" }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(
      page.getByRole("heading", { name: "Khu vực quản trị" }),
    ).toBeVisible()

    // 3. Đổi lúa thưởng hàng ngày sang một giá trị mới.
    const newAmount = originalDailyRewardAmount + 5
    const rewardSection = page
      .locator("section")
      .filter({ hasText: "Lúa thưởng hàng ngày" })
    const amountInput = rewardSection.getByRole("spinbutton")

    await amountInput.fill(String(newAmount))
    const saveButton = rewardSection.getByRole("button", { name: "Lưu" })
    await saveButton.click()

    // Nút bị disabled ("Đang lưu...") trong lúc server action chạy, rồi
    // enable lại khi xong — đợi đủ 2 trạng thái này (thay vì reload ngay) để
    // chắc chắn giá trị đã thật sự ghi xuống DB trước khi kiểm tra.
    await expect(saveButton).toBeDisabled()
    await expect(saveButton).toBeEnabled()

    // `router.refresh()` re-fetch Server Component, nhưng input vẫn giữ
    // state cục bộ đã gõ — reload thật để chắc chắn đang đọc giá trị đã ghi
    // xuống DB, không phải chỉ echo lại state client.
    await page.reload()

    // 4. Xác nhận UI phản ánh đúng giá trị mới đã lưu.
    await expect(
      page
        .locator("section")
        .filter({ hasText: "Lúa thưởng hàng ngày" })
        .getByRole("spinbutton"),
    ).toHaveValue(String(newAmount))
  })
})
