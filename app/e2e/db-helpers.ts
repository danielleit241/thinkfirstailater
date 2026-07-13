/**
 * Tiện ích DB dùng chung cho 2 golden-flow spec (Phase 9). Chỉ dùng để
 * chuẩn bị/dọn dẹp dữ liệu mà bản thân UI không có cách nào tạo ra trong một
 * phiên chạy test ngắn (ví dụ: một voucher giá rẻ để test redemption không
 * phải chờ nhiều ngày để tích đủ lúa) — mọi hành vi được kiểm chứng (đăng ký,
 * đăng nhập, hoàn thành activity, nhận lúa, đổi voucher, đổi cấu hình) đều đi
 * qua UI thật, không giả lập qua DB.
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
import { randomUUID } from "node:crypto"
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

/** Voucher demo riêng cho E2E, giá đúng bằng lúa user thật sự nhận được qua UI. */
export async function createE2eTestVoucher(riceCost: number) {
  const id = randomUUID()
  const slug = `e2e-golden-flow-voucher-${randomUUID()}`
  await withClient((client) =>
    client.query(
      `INSERT INTO "voucher"
         (id, slug, brand, title, description, "riceCost", active, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())`,
      [
        id,
        slug,
        "E2E Test Brand",
        "Voucher kiểm thử E2E (demo)",
        "Voucher chỉ dùng cho Playwright E2E, không phải mã thật.",
        riceCost,
      ],
    ),
  )
  return { id, slug }
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

export async function deleteTestVoucher(voucherId: string) {
  await withClient((client) =>
    client.query(`DELETE FROM "voucher" WHERE id = $1`, [voucherId]),
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
