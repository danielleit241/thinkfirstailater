# think-first-ai-later — app

Next.js 16 full-stack app (frontend + server) for the AI Learning Rewards platform.

## Local PostgreSQL (Docker)

This app needs PostgreSQL for Prisma/Better Auth. A `docker-compose.yml` at the
repo root provisions a local dev Postgres instance.

From the repo root (not from `app/`):

```bash
docker compose up -d
```

Wait for the `postgres` service healthcheck to pass (`docker compose ps` should
show `healthy`), then from `app/`:

```bash
npm run db:migrate
npm run test:integration
```

To stop the database:

```bash
docker compose down
```

Data persists across `down`/`up` cycles via the named volume `postgres_data`
(only `docker compose down -v` removes it).

Copy `.env.example` to `.env` and adjust `DATABASE_URL`/`DIRECT_URL` if you map
Postgres to a different host port.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run db:migrate` — run Prisma migrations against the Docker Postgres
- `npm run db:seed` — seed learning catalog + reward config + voucher catalog (idempotent — chạy lại nhiều lần không nhân bản dữ liệu)
- `npm run test:integration` — run Vitest integration tests against the Docker Postgres
- `npm run admin:bootstrap` — create the first ADMIN user from env credentials (idempotent)

## Setup env: local Docker vs Vercel/Neon/Supabase thật

`.env.example` liệt kê 2 biến kết nối DB tách biệt vai trò:

| Biến           | Vai trò                                                                  | Local (Docker Compose)                            | Vercel + Neon/Supabase thật                                                                                            |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | App dùng lúc runtime, qua `@prisma/adapter-pg` (`src/server/db.ts`)      | Trỏ thẳng Postgres Docker (không có pooler riêng) | **Pooled** connection string (pgbouncer) — bắt buộc vì serverless mở nhiều connection ngắn hạn                         |
| `DIRECT_URL`   | CLI dùng cho migration (`prisma migrate deploy`, xem `prisma.config.ts`) | Cùng connection string với `DATABASE_URL`         | **Direct** connection string (bỏ qua pooler) — bắt buộc vì DDL/session lock không chạy tốt qua pooler transaction-mode |

`prisma.config.ts` và `src/server/db.ts` đã dùng đúng 2 biến này từ Phase 2 (đã xác nhận lại ở phase hardening này, không cần sửa logic). Next.js 16 App Router chạy Node runtime mặc định trên Vercel — không cần thêm `vercel.json` cho phase/scope hiện tại.

Các biến còn lại (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_BOOTSTRAP_*`) dùng chung ý nghĩa ở cả 2 môi trường — chỉ khác giá trị (secret thật/random cho production, URL public thật thay vì `localhost`).

## Lệnh test đầy đủ

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
npm run test:integration
npx playwright test   # xem thêm phần E2E (nếu đã cài @playwright/test trong phase này)
```

Tất cả phải xanh trước khi coi một thay đổi là hoàn tất. `test:integration` cần Postgres Docker đang chạy (xem phần trên).

## Quy trình migration/release

Thứ tự bắt buộc khi release (kể cả rehearsal cục bộ lẫn khi deploy Vercel/Neon/Supabase thật sau này):

1. `npx prisma migrate deploy` chạy trên `DIRECT_URL` (xem `prisma.config.ts`) — **trước** khi app (`next start` hoặc Vercel deployment) nhận traffic mới.
2. `npm run db:seed` (idempotent — an toàn khi chạy lại nhiều lần, không nhân bản learning catalog/reward config/voucher).
3. Khởi động app (`next start` / Vercel).

**Rollback caveat**: Prisma không tự động rollback migration đã `deploy`. Nếu một migration gây lỗi, cách xử lý là (a) restore DB từ backup gần nhất, hoặc (b) viết tay một migration mới đảo ngược thay đổi (down migration thủ công) — Prisma không sinh sẵn file down. Toàn bộ migration set hiện tại (`prisma/migrations/`) chỉ là các thay đổi additive (thêm bảng/cột, không đổi/xoá dữ liệu hiện có), nên rollback caveat này **là lý thuyết** — phase này chưa có migration nào cần rollback thật, và rehearsal chỉ xác nhận additive-deploy chạy sạch trên DB có sẵn dữ liệu, không xác nhận một rollback thật.

## Giới hạn deploy readiness (accepted, đã chốt ở Phase 9)

- Phiên làm việc này **không** có tài khoản/credentials Vercel/Neon/Supabase thật — mọi "live smoke" chỉ là rehearsal cục bộ: `npm run build` + `next start` trỏ vào Postgres Docker, đi qua 2 golden flow (user & admin) bằng tay/Playwright. Chưa từng test cold start/kết nối serverless thật trên hạ tầng Vercel.
- **Accepted risk**: chưa có email verification/reset password. Không dùng cấu hình hiện tại để mở production rộng rãi cho người dùng thật cho tới khi bổ sung tính năng này.
- Rate limit đăng ký/đăng nhập (`src/server/auth/rate-limit.ts`) dùng bộ đếm in-memory theo process, khoá theo IP lấy từ header `x-forwarded-for` không kiểm chứng proxy tin cậy — đây là mitigation **best-effort**, không phải hàng rào chống DoS chắc chắn, và **không sống sót qua nhiều instance** (một yếu tố cần cân nhắc nếu Vercel scale ra nhiều serverless instance đồng thời — xem comment trong chính file đó).

## Architecture Decisions

Tóm tắt các quyết định thiết kế lớn đã chốt qua các phase (không lặp lại chi tiết — xem code/comment tại các vị trí liệt kê):

- **Modular monolith**: một Next.js app (frontend + server actions/route handlers) trong một repo, chia theo domain (`src/server/{auth,learning,rewards,vouchers,admin}`) thay vì tách microservice — phù hợp quy mô demo.
- **Ledger-based reward** (Phase 6): lúa thưởng được cộng dồn qua các bản ghi `DailyReward` (một dòng/lần claim), không phải một cột số dư có thể ghi đè tuỳ ý — đảm bảo lịch sử claim không bị mất và số dư luôn tính lại được từ ledger.
- **Snapshot non-retroactivity cho admin** (Phase 8): khi admin đổi `dailyRewardAmount` hoặc giá voucher, thay đổi chỉ áp dụng cho lượt claim/đổi **tiếp theo** — các bản ghi `DailyReward`/lịch sử đổi voucher đã lưu giữ nguyên giá trị tại thời điểm phát sinh (xem comment tại `src/server/admin/service.ts`). Riêng trạng thái `active`/`sortOrder` của track/module/activity thì phản ánh ngay lập tức (không snapshot) vì đây là nội dung hiển thị, không phải giao dịch.
- **Rate-limit best-effort theo IP header** (Phase 3): xem mục "Giới hạn deploy readiness" ở trên — caveat đã ghi trong code (`src/server/auth/rate-limit.ts`).
