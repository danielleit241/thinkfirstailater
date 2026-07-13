# Fix Report: Better Auth built-in rate limiter chặn nhầm E2E test thứ 4 (register)

Date: 2026-07-13 10:45
Mode: auto

## Symptom

`npx playwright test` (4 test: `admin-golden-flow.spec.ts` × 2 project + `user-golden-flow.spec.ts` × 2 project, chạy tuần tự cùng 1 server `next start`) luôn fail đúng test thứ 4 (`[mobile] user-golden-flow.spec.ts`): UI dừng lại ở `/register`, hiển thị "Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút." thay vì redirect sang `/dashboard`.

## Reproduction

- Command: `npx playwright test` (từ `app/`, server đã chạy `npm run build && npm run start` trước)
- Pre-fix result: 3 passed / 1 failed — luôn luôn là test đăng ký thứ 4 trong suite, bất kể giá trị `x-forwarded-for` gán cho từng test có ngẫu nhiên/khác nhau hay không.

## Root Cause

Better Auth (thư viện auth, `better-auth@1.6.23`) có rate limiter **built-in riêng**, độc lập hoàn toàn với middleware tự viết ở `app/src/server/auth/rate-limit.ts`. Rate limiter này:
- Chỉ bật khi chạy production (`next start` — đúng cách E2E chạy).
- Có rule đặc biệt cứng hơn cho path bắt đầu bằng `/sign-in` hoặc `/sign-up`: `window: 10s, max: 3` (xem `node_modules/better-auth/dist/api/rate-limiter/index.mjs`, hàm `getDefaultSpecialRules()`).
- Key theo `getIp(req, ctx.options)`. Vì `app/src/server/auth.ts` chưa cấu hình `advanced.ipAddress` (không có reverse proxy đáng tin), `getIp()` không xác định được IP thật và fallback về **DÙNG CHUNG một bucket** (`"no-trusted-ip"`) cho mọi request khớp path đó — bất kể request đến từ ai.

Kết quả: chỉ 3 lượt đăng nhập/đăng ký (từ BẤT KỲ client nào) trong 10 giây là toàn bộ các client khác cũng bị chặn theo. Middleware tự viết (`rate-limit.ts`, key theo `x-forwarded-for`) không liên quan gì đến lỗi này — đã xác nhận bằng debug logging: mỗi request trong suite đều có key mới hoàn toàn (fresh) và middleware tự viết luôn trả `allowed: true` cho key đó.

## Why Now

Không phải regression — đây là hành vi mặc định của Better Auth kể từ khi tích hợp thư viện này (Phase 3), chỉ chưa từng bị phát hiện vì:
- Rate limiter built-in của Better Auth chỉ bật ở production (`next start`); các lần verify thủ công trước đây chủ yếu chạy `next dev`.
- Đây là lần đầu tiên chạy đủ ≥4 lượt đăng ký/đăng nhập liên tiếp trong <10s nhắm vào server production build (Phase 9, rehearsal E2E build+start thật).

## Blast Radius

- `app/src/server/auth.ts` — thêm `rateLimit: { enabled: false }`. Tắt **toàn cục**, không chỉ riêng sign-in/sign-up — mất built-in protection cho `change-password`, `change-email`, `forget-password`, email-otp. Chấp nhận được: change-password/change-email đã yêu cầu session (không phải bề mặt brute-force công khai); xác thực email/reset password chưa được bật trong app này (Not Doing, Phase 3).
- `app/src/server/auth/rate-limit.ts` + `app/src/app/api/auth/[...all]/route.ts` — không đổi, đây là lớp mitigation duy nhất còn lại cho 2 path công khai nhạy cảm nhất (`sign-up/email` 5/60s, `sign-in/email` 10/60s) — đã review/chấp nhận từ Phase 3.
- `app/e2e/user-golden-flow.spec.ts`, `app/e2e/admin-golden-flow.spec.ts` — header `x-forwarded-for` ngẫu nhiên (thêm trong phiên debug này) vẫn cần giữ lại: middleware tự viết vẫn key theo header này, không giữ sẽ đụng chung bucket `"unknown"` giữa các lần chạy/project.

## Fix Applied

- `app/src/server/auth.ts` — thêm `rateLimit: { enabled: false }` vào config `betterAuth({...})`, kèm comment tiếng Việt giải thích root cause, phạm vi tắt (toàn cục), lý do chấp nhận được, và rủi ro còn lại khi deploy Vercel thật.

## Attempt History

| Attempt | Result | Evidence | Next Approach |
| --- | --- | --- | --- |
| 1 (sai) | failed | Thêm `x-forwarded-for` ngẫu nhiên ở `test.use()` cấp `describe` — đánh giá sai vì module chỉ load 1 lần, 2 project desktop/mobile dùng chung 1 UUID | Chuyển sang `beforeEach` + `page.setExtraHTTPHeaders()` |
| 2 (sai) | failed | Sửa sang `beforeEach`, test thứ 4 vẫn 429 dù key `x-forwarded-for` xác nhận fresh (đọc trace network) | Nghi ngờ nguồn 429 khác — dùng `fix` skill, dispatch `scout --diagnose` |
| 3 (đúng) | passed | `scout --diagnose` tìm ra Better Auth có rate limiter built-in riêng (đọc trực tiếp `node_modules/better-auth/dist/api/rate-limiter/index.mjs`), xác nhận root cause thật | Áp dụng `rateLimit: { enabled: false }` |

## Problem-Solving Handoff

Triggered: không (root cause được xác nhận ở attempt 3 qua scout/diagnose, không cần `problem-solving`)

## Prevention Guard

Guard: E2E suite chạy đủ 4 test tuần tự (2 spec × 2 project) trên server production build chính là guard tái phát hiện lỗi này nếu regress — không cần guard riêng, vì bug chỉ lộ ra khi chạy ≥4 lượt đăng ký/đăng nhập liên tiếp trong <10s, và suite E2E hiện tại đã tự nhiên tạo đủ điều kiện đó mỗi lần chạy.

## Verification Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Repro | PASS | `npx playwright test` — 3 lần chạy liên tiếp sau fix, cả 3 lần đều 4 passed (trước fix: luôn 3 passed/1 failed ở test thứ 4) |
| Positive path | PASS | `npm run test:integration` — 72/72 test pass (11 file), không regression |
| Blast radius | PASS | `npm run lint` sạch, `npm run type-check` sạch |

## Review

Verdict: APPROVED

Findings:
- [MEDIUM, đã sửa] Comment ban đầu chỉ nói phạm vi tắt là sign-in/sign-up, thực tế `enabled: false` tắt toàn cục (bao gồm change-password/change-email/forget-password/email-otp). Đã mở rộng comment trong `auth.ts` để nêu rõ phạm vi thật và lý do chấp nhận được.
- [LOW, ghi nhận residual risk] Xem mục Residual Risk bên dưới.

## Residual Risk

- Khi deploy thật lên Vercel (target đã chọn ở Phase 9): Vercel có thể cung cấp header IP đáng tin ở edge, và trên serverless nhiều instance thì `Map` trong-process của `rate-limit.ts` cũng không còn đáng tin (không share state giữa instance). Trước khi deploy thật, cần: (a) cấu hình `advanced.ipAddress` (trusted proxy headers của Vercel) để bật lại rate limiter built-in của Better Auth với key IP đáng tin, hoặc (b) chuyển middleware tự viết sang shared store (Redis/DB-backed counter). Đã ghi chú trực tiếp trong comment tại `auth.ts`.
