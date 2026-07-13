/**
 * Learning catalog seed (Phase 4) CLI entry point: `npm run db:seed`.
 * Idempotent — the actual upsert-by-slug logic lives in
 * `src/server/learning/seed-data.ts`, so the same logic can be reused by the
 * integration test that proves running it twice creates no duplicates.
 */
import { prisma } from "@/server/db"
import { seedLearningCatalog } from "@/server/learning/seed-data"
import { seedRewardConfig } from "@/server/rewards/seed-data"
import { seedVouchers } from "@/server/vouchers/seed-data"

async function main() {
  await seedLearningCatalog()
  console.log("Seed: learning catalog upserted (idempotent).")
  await seedRewardConfig()
  console.log("Seed: reward config ensured (idempotent).")
  await seedVouchers()
  console.log("Seed: voucher catalog upserted (idempotent).")
}

main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
