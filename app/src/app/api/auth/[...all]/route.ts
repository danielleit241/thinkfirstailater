import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/server/auth"
import { logAuthEvent } from "@/server/auth/log"
import { checkRateLimit } from "@/server/auth/rate-limit"

const { GET, POST: handlePost } = toNextJsHandler(auth)

export { GET }

// Bounded mitigation for register/login brute-force (see rate-limit.ts for
// the accepted single-process scope of this demo). Only these two paths are
// limited — the rest of Better Auth's HTTP surface (get-session, sign-out,
// ...) is left untouched.
type LimitedKind = "register" | "login"

const LIMITED_ROUTES: Record<
  string,
  { kind: LimitedKind; max: number; windowMs: number }
> = {
  "/api/auth/sign-up/email": { kind: "register", max: 5, windowMs: 60_000 },
  "/api/auth/sign-in/email": { kind: "login", max: 10, windowMs: 60_000 },
}

// Accepted best-effort limitation (self-hosted single-process demo, không có
// reverse proxy nào đứng trước để đảm bảo `x-forwarded-for` là header đáng
// tin): client có thể tự gửi một giá trị x-forwarded-for khác nhau mỗi request
// để lấy bucket rate-limit mới, khiến mitigation này không chặn được kẻ tấn
// công cố ý giả mạo header — chỉ hiệu quả với brute-force không chủ đích né
// tránh. Nếu triển khai sau reverse proxy đáng tin (Nginx/Cloudflare tự set
// lại header), cần đổi sang đọc IP từ header do proxy đó ghi, không tin giá
// trị client gửi trực tiếp.
function clientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  return forwardedFor?.split(",")[0]?.trim() || "unknown"
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.clone().json()) as { code?: string }
    return body?.code
  } catch {
    return undefined
  }
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname
  const limited = LIMITED_ROUTES[pathname]

  if (limited) {
    const key = `${limited.kind}:${clientKey(request)}`
    const result = checkRateLimit(key, limited)

    if (!result.allowed) {
      logAuthEvent(`auth.${limited.kind}.rate_limited`)
      return Response.json(
        { message: "Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút." },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil((result.retryAfterMs ?? 0) / 1000)),
          },
        },
      )
    }
  }

  const response = await handlePost(request)

  if (limited) {
    if (response.ok) {
      logAuthEvent(`auth.${limited.kind}.success`)
    } else {
      const code = await readErrorCode(response)
      logAuthEvent(`auth.${limited.kind}.failed`, code ? { code } : undefined)
    }
  }

  return response
}
