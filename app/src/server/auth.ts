import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db"
import { env } from "./env"

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Better Auth có rate limiter riêng, tự bật khi chạy production (`next
  // start`), độc lập với `src/server/auth/rate-limit.ts` (middleware tự viết,
  // đã cố ý keyed theo `x-forwarded-for` cho scope demo này — xem comment ở
  // đó). Không có reverse proxy đứng trước để cung cấp IP đáng tin, nên rate
  // limiter riêng của Better Auth không xác định được IP và fallback về DÙNG
  // CHUNG một bucket cho mọi request tới `/sign-in*`/`/sign-up*` (mặc định
  // window 10s, max 3) — nghĩa là chỉ 3 lượt đăng nhập/đăng ký từ BẤT KỲ ai
  // trong 10s là mọi người khác đều bị chặn.
  //
  // `enabled: false` tắt rate limiter này TOÀN CỤC (không chỉ riêng
  // sign-in/sign-up) — mất luôn built-in protection cho change-password,
  // change-email, forget-password và email-otp. Chấp nhận được ở scope hiện
  // tại vì: change-password/change-email đã yêu cầu session (không phải bề
  // mặt brute-force công khai), còn xác thực email/reset password chưa được
  // bật trong app này (Not Doing, đã ghi nhận ở Phase 3). Middleware tự viết
  // trong `rate-limit.ts` chỉ che 2 path công khai nhạy cảm nhất
  // (sign-up/email, sign-in/email) — đã được review và chấp nhận thay thế.
  //
  // Rủi ro còn lại (deploy Vercel thật sau này, chưa xảy ra trong phiên demo
  // này): Vercel có thể cung cấp header IP đáng tin ở edge, và trên serverless
  // nhiều instance thì Map trong-process của `rate-limit.ts` cũng không còn
  // đáng tin — trước khi deploy thật cần cấu hình `advanced.ipAddress` để bật
  // lại rate limiter này, hoặc chuyển middleware tự viết sang shared store
  // (Redis/DB).
  rateLimit: {
    enabled: false,
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        input: false,
      },
    },
  },
})
