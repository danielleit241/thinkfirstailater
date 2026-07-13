import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"

import { deleteTestUserByEmail } from "./db-helpers"

/**
 * Golden flow #1 (User, ≤5 phút): landing → đăng ký → hoàn thành activity
 * → nhận lúa → đổi voucher seed 10 lúa → xem lịch sử. Sau lần vào landing
 * đầu tiên, toàn bộ bước nghiệp vụ đều đi qua link/button thật; test không
 * tạo voucher fixture riêng và không nhảy route bằng page.goto().
 */
test.describe("Golden flow: User", () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": randomUUID() })
  })

  const email = `e2e-user-golden-${randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"
  const name = "Người dùng E2E"

  test.afterAll(async () => {
    await deleteTestUserByEmail(email)
  })

  test("đăng ký, hoàn thành 1 hoạt động, nhận lúa, và đổi 1 quà", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Bắt đầu bài đầu tiên" }).click()
    await expect(page).toHaveURL(/\/register$/)
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Tạo tài khoản học" }),
    ).toBeVisible()

    await page.getByLabel("Họ và tên").fill(name)
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Mật khẩu").fill(password)
    await page.getByRole("button", { name: "Đăng ký" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole("heading", { name: new RegExp(`Chào ${name}`) }),
    ).toBeVisible()
    await page.getByRole("link", { name: "Lộ trình" }).click()

    await page.getByRole("link", { name: /Đặt câu hỏi tốt/ }).click()
    await page
      .getByRole("link", { name: /Tự đánh giá trước khi hỏi AI/ })
      .click()

    await page.getByRole("button", { name: "Tôi hiểu đề bài" }).click()
    await page.getByRole("button", { name: "Tôi đã có giả thuyết" }).click()
    await page.getByRole("button", { name: "Tôi biết cần hỏi gì" }).click()
    await page.getByRole("button", { name: "Xác nhận hoàn thành" }).click()

    await expect(page.getByText(/Đã hoàn thành và nhận lúa/)).toBeVisible()
    await page.getByRole("link", { name: "Xem quà đổi được" }).click()

    const welcomeVoucher = page
      .getByRole("article")
      .filter({ hasText: "Voucher chào mừng người học " })
    await expect(welcomeVoucher).toHaveCount(1)
    await welcomeVoucher.getByRole("button", { name: "Đổi quà" }).click()
    await expect(welcomeVoucher.getByText(/Dùng \d+ lúa để đổi/)).toBeVisible()
    const confirmRedeemButton = welcomeVoucher.getByRole("button", {
      name: "Xác nhận đổi",
    })
    await expect(confirmRedeemButton).toBeFocused()
    await welcomeVoucher.getByRole("button", { name: "Hủy" }).click()
    const redeemButton = welcomeVoucher.getByRole("button", {
      name: "Đổi quà",
    })
    await expect(redeemButton).toBeFocused()
    await redeemButton.click()
    await expect(confirmRedeemButton).toBeFocused()
    await confirmRedeemButton.click()
    await expect(
      welcomeVoucher.getByText("Đổi quà thành công.", { exact: false }),
    ).toBeVisible()
    await welcomeVoucher
      .getByRole("link", { name: "Xem lịch sử đổi quà" })
      .click()

    await expect(
      page.getByRole("heading", { name: "Những phần thưởng bạn đã đổi." }),
    ).toBeVisible()
    await expect(page.getByText("Voucher chào mừng người học ")).toBeVisible()
  })
})
