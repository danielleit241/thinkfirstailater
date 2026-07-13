# Deploy lên Vercel — hướng dẫn từng bước

Không dùng Terraform/IaC cho project này (xem lý do ở cuối file). Toàn bộ hạ
tầng dựng qua Vercel dashboard trong vài phút; phần lặp-lại-mỗi-lần-deploy
(migrate schema, seed dữ liệu demo, tạo admin) tự động qua GitHub Actions.

## Yêu cầu trước khi bắt đầu

- Repo đã push lên GitHub: `danielleit241/thinkfirstailater`.
- Có tài khoản [Vercel](https://vercel.com) (đăng nhập bằng GitHub cho tiện).
- Node.js 22+ ở máy local (để chạy migrate/seed lần đầu) — xem `engines` trong `package.json`.

---

## Bước 1 — Import project vào Vercel

1. Vercel dashboard → **Add New → Project** → chọn repo `thinkfirstailater`.
2. Ở màn hình cấu hình import, mở **Root Directory** → chọn `app` (code Next.js nằm trong thư mục `app/`, không phải root repo — root repo chỉ có `docker-compose.yml` cho Postgres local).
3. Framework Preset: Vercel tự nhận `Next.js`. Build Command/Output giữ nguyên mặc định — sẽ sửa Build Command ở Bước 4.
4. **Chưa bấm Deploy** — qua Bước 2 để gắn database trước, tránh lần build đầu tiên fail vì thiếu `DATABASE_URL`.

## Bước 2 — Gắn Postgres (Neon hoặc Supabase)

Project Vercel → tab **Storage** → **Connect Database** (hoặc **Browse Marketplace** nếu không thấy) → chọn **Neon** hoặc **Supabase** → theo hướng dẫn tạo database mới.

Vercel tự động bơm connection string vào Environment Variables của project — nhưng **tên biến Vercel đặt không khớp tên biến app cần**. App cần đúng 2 biến này (xem `src/server/env.ts`):

| App cần | Lấy giá trị từ |
|---|---|
| `DATABASE_URL` | Biến pooled mà Vercel/Neon vừa tạo (thường có tên `POSTGRES_URL` hoặc `DATABASE_URL` — có chữ `-pooler` trong host, hoặc query có `pgbouncer=true`) |
| `DIRECT_URL` | Biến direct/unpooled (thường có tên `POSTGRES_URL_NON_POOLING` hoặc tương tự — **không** có `-pooler`/`pgbouncer`) |

Vào **Settings → Environment Variables**, thêm 2 biến `DATABASE_URL` và `DIRECT_URL` với đúng 2 giá trị trên (copy-paste, không cần gõ tay). Nếu Neon/Supabase integration đã tự đặt sẵn tên đúng thì bỏ qua bước copy này.

> Vì sao cần 2 URL khác nhau: `DIRECT_URL` dùng cho `prisma migrate deploy` (DDL cần session-level lock, pooler transaction-mode không hỗ trợ tốt). `DATABASE_URL` dùng lúc app chạy thật qua `@prisma/adapter-pg` (serverless mở nhiều connection ngắn hạn, cần pooler để không vượt giới hạn connection của DB). Xem thêm comment trong `.env.example`.

## Bước 3 — Set các Environment Variable còn lại

Vẫn ở **Settings → Environment Variables**, thêm cho **Production** và **Preview**:

```
BETTER_AUTH_SECRET=<chuỗi random ≥32 ký tự>
BETTER_AUTH_URL=https://<domain-vercel-của-bạn>
NEXT_PUBLIC_APP_URL=https://<domain-vercel-của-bạn>
ADMIN_BOOTSTRAP_EMAIL=<email admin thật>
ADMIN_BOOTSTRAP_PASSWORD=<password admin thật>
```

- Tạo `BETTER_AUTH_SECRET` nhanh: `openssl rand -base64 32` (hoặc bất kỳ chuỗi random ≥32 ký tự).
- Domain Vercel chỉ có sau khi deploy lần đầu (dạng `<project>.vercel.app`) — nếu chưa biết, tạm điền domain đó (đoán đúng theo tên project) hoặc để deploy lần 1 xong rồi sửa lại `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` cho khớp, sau đó **Redeploy**.
- `NEXT_PUBLIC_API_URL` không cần set — app tự phục vụ API qua Server Actions, không có backend riêng.

## Bước 4 — Đặt Build Command để migrate tự động mỗi lần deploy

**Settings → Build and Deployment → Build Command** → override thành:

```
prisma migrate deploy && next build
```

Nhờ đó mọi lần deploy (kể cả preview) đều tự áp migration mới nhất trước khi build code mới — không có deploy nào chạy code mới trên schema cũ.

## Bước 5 — Deploy lần đầu

Bấm **Deploy**. Theo dõi build log — nếu lỗi thiếu Prisma Client, kiểm tra `postinstall: "prisma generate"` trong `package.json` (đã có sẵn trong repo).

Sau khi deploy xong, nếu domain thật khác với domain bạn điền ở Bước 3, sửa `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` cho đúng rồi **Redeploy** (Deployments → ⋯ → Redeploy).

## Bước 6 — Seed dữ liệu demo + tạo admin (lần đầu, chạy tay)

Từ máy local, tạm trỏ vào database production (copy `DATABASE_URL`/`DIRECT_URL` thật từ Vercel dán vào đây, đừng commit):

```bash
cd app
DATABASE_URL="<pooled thật>" \
DIRECT_URL="<direct thật>" \
npm run db:seed

DATABASE_URL="<pooled thật>" \
DIRECT_URL="<direct thật>" \
BETTER_AUTH_SECRET="<secret thật, khớp Vercel>" \
BETTER_AUTH_URL="<domain thật>" \
ADMIN_BOOTSTRAP_EMAIL="<email thật>" \
ADMIN_BOOTSTRAP_PASSWORD="<password thật>" \
npm run admin:bootstrap
```

Cả 2 lệnh đều idempotent — chạy lại không tạo trùng dữ liệu, không lỗi.

## Bước 7 — Tự động seed/bootstrap từ lần deploy sau (GitHub Actions)

Repo có sẵn `.github/workflows/post-deploy.yml`: mỗi lần push `main` (khi động tới `prisma/`, seed data hoặc `admin-bootstrap.ts`), tự chạy lại `db:seed` + `admin:bootstrap` — không cần lặp lại Bước 6 bằng tay nữa.

Vào **GitHub repo → Settings → Environments → New environment**, đặt tên `production`. Rồi **Settings → Secrets and variables → Actions**, thêm vào environment `production` (copy y nguyên giá trị đã set ở Vercel):

```
DATABASE_URL
DIRECT_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
ADMIN_BOOTSTRAP_EMAIL
ADMIN_BOOTSTRAP_PASSWORD
```

> Không muốn dùng GitHub Environment gating? Thêm secrets ở mức repo bình thường và xóa dòng `environment: production` trong `post-deploy.yml`.

## Bước 8 — Kiểm tra

- Vào `https://<domain>/register`, tạo thử user → `/dashboard` phải hiện "Việc tiếp theo" + `0/…` hoạt động (dữ liệu học đã seed).
- Vào `/vouchers` → phải thấy nhiều voucher có ảnh minh hoạ.
- Đăng nhập bằng `ADMIN_BOOTSTRAP_EMAIL`/`PASSWORD` → vào `/admin` → thấy danh sách voucher + nội dung học đầy đủ.

---

## Vì sao không dùng Terraform/IaC

Vercel Marketplace đã có sẵn tích hợp một-click cho Neon/Supabase (tự tạo DB, tự bơm connection string) và Better Auth không phải dịch vụ cần "provision" — nó chỉ là thư viện chạy trong code, cần đúng 2 biến env như mọi biến khác. Terraform chỉ đáng công khi cần tái tạo hạ tầng giống nhau ở nhiều môi trường/nhiều người hoặc review hạ tầng qua PR — chưa cần ở quy mô một người demo hiện tại. Việc thật sự lặp lại mỗi lần deploy (migrate/seed/bootstrap) đã tự động qua GitHub Actions, không phải qua Terraform.
