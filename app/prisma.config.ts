// Prisma 7 CLI configuration. The CLI (migrate/generate/studio) connects using
// DIRECT_URL, which bypasses any pooler and is required for schema migrations.
// The application runtime connects separately via `@prisma/adapter-pg` using
// DATABASE_URL (see `src/server/db.ts`).
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
})
