/**
 * Tiện ích DB dùng chung cho 2 golden-flow spec (Phase 9). Chỉ dùng để
 * dọn dẹp user test và chuẩn bị role/config cho admin flow. User golden flow
 * dùng nguyên catalog/seed sản phẩm; không tạo voucher fixture riêng. Mọi
 * hành vi được kiểm chứng (đăng ký, hoàn thành activity, nhận lúa, đổi quà)
 * đều đi qua UI thật, không giả lập qua DB.
 *
 * Dùng `pg` (raw SQL, driver có sẵn trong `dependencies`) thay vì Prisma
 * Client thật của app: client Prisma sinh ra (`src/generated/prisma/client`)
 * là module ESM thuần (dùng `import.meta.url`), không tương thích với cách
 * Playwright Test tự biên dịch/nạp file TS của nó (CommonJS transform) — cùng
 * mã nguồn chạy rất tốt trong Vitest (Vite/ESM thật) nhưng lỗi
 * `Cannot use 'import.meta' outside a module` khi import trong tiến trình
 * Playwright. Raw SQL né hoàn toàn vấn đề nạp module này; tên bảng/cột khớp
 * đúng `prisma/schema.prisma` (đọc từ các file `migration.sql` trong
 * `prisma/migrations`).
 */
import "dotenv/config"
import { Client } from "pg"

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

/**
 * Xoá sạch một user test + mọi dữ liệu liên quan (cascade qua FK
 * `ON DELETE CASCADE` — xem `prisma/migrations`). Phải gọi trước khi xoá
 * voucher test: `voucher_redemption.voucherId` không cascade, còn redemption
 * tham chiếu voucher sẽ chặn xoá voucher.
 */
export async function deleteTestUserByEmail(email: string) {
  await withClient((client) =>
    client.query(`DELETE FROM "user" WHERE email = $1`, [email]),
  )
}

export async function promoteToAdminByEmail(email: string) {
  await withClient((client) =>
    client.query(`UPDATE "user" SET role = 'ADMIN' WHERE email = $1`, [email]),
  )
}

export async function getRewardConfigAmount(): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query<{ dailyRewardAmount: number }>(
      `SELECT "dailyRewardAmount" FROM "reward_config" ORDER BY "createdAt" DESC LIMIT 1`,
    )
    const row = result.rows[0]
    if (!row) {
      throw new Error(
        "RewardConfig chưa được seed — chạy `npm run db:seed` trước.",
      )
    }
    return row.dailyRewardAmount
  })
}

export async function setRewardConfigAmount(amount: number) {
  await withClient((client) =>
    client.query(
      `UPDATE "reward_config" SET "dailyRewardAmount" = $1, "updatedAt" = now()
       WHERE id = (SELECT id FROM "reward_config" ORDER BY "createdAt" DESC LIMIT 1)`,
      [amount],
    ),
  )
}
