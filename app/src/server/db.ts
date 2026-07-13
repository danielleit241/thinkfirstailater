import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"
import { env } from "./env"
import { logSystemEvent } from "./system/log"

// Avoid opening a new connection pool on every hot reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const isNewColdStart = globalForPrisma.prisma === undefined

// Neon/Supabase's pooled endpoint presents a cert chain that node-postgres's
// stricter verify-full-by-default (pg 8.16+) rejects as self-signed. Local
// Docker Postgres has no TLS at all, so only relax verification for remote
// hosts. This has to be encoded as `sslmode` in the connection string itself
// — `pg.ConnectionParameters` re-parses `connectionString` and overwrites any
// `ssl` option passed alongside it (see `pg/lib/connection-parameters.js`).
function withRelaxedSsl(connectionString: string) {
  const url = new URL(connectionString)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return connectionString
  }
  url.searchParams.set("sslmode", "no-verify")
  return url.toString()
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: withRelaxedSsl(env.DATABASE_URL),
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Đánh dấu cold start (lần đầu module này được load, ví dụ sau khi function
// serverless khởi động lại) và log lỗi nếu kết nối DB thất bại ngay từ đầu.
// Không chặn module load — chỉ fire-and-forget để vận hành thấy lỗi trong log.
if (isNewColdStart) {
  logSystemEvent("system.cold_start")
  prisma.$connect().catch((error: unknown) => {
    logSystemEvent("system.db_connection.failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    })
  })
}
