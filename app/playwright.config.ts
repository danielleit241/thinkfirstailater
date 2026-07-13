import "dotenv/config"
import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright config cho 2 golden flow (Phase 9). `baseURL` trỏ tới cổng
 * `next dev -p 5173` / `next start -p 5173` hiện có trong `package.json`.
 *
 * KHÔNG dùng `webServer` để tự khởi động Next: app cần một Postgres Docker
 * đang chạy + các biến môi trường (`DATABASE_URL`, `DIRECT_URL`,
 * `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) đã đúng trước khi khởi động, việc
 * này phức tạp hơn một `webServer` tự quản lý an toàn. Người chạy test phải
 * tự khởi động server trước (`npm run dev` hoặc `npm run build && npm run
 * start`), trỏ đúng DB Docker cục bộ, rồi mới chạy `npm run test:e2e`.
 *
 * 2 project: `desktop` (viewport chuẩn ~1280x800) và `mobile` (dùng device
 * preset Pixel 5 của Playwright — không cần cài trình duyệt riêng, chỉ đổi
 * viewport/UA/touch giả lập trên cùng Chromium đã cài).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  // Cả 2 spec cùng đọc/ghi `RewardConfig` (dùng chung cho toàn bộ DB, không
  // theo user) — chạy tuần tự (1 worker) để tránh 2 spec đổi giá trị này
  // cùng lúc và làm nhiễu assertion của nhau.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
})
