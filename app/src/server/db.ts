import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"
import { env } from "./env"
import { logSystemEvent } from "./system/log"

// Avoid opening a new connection pool on every hot reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const isNewColdStart = globalForPrisma.prisma === undefined

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
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
