import Link from "next/link"
import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Đăng nhập",
}

export default function LoginPage() {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[var(--leaf)]">
        Tiếp tục lộ trình
      </p>
      <h1 className="mb-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ink)]">
        Chào bạn trở lại
      </h1>
      <p className="mb-8 text-sm leading-6 text-[var(--ink-muted)]">
        Đăng nhập để tiếp tục hoạt động đang dở và giữ nhịp học của bạn.
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--leaf)] underline-offset-4 hover:underline"
        >
          Tạo tài khoản
        </Link>
      </p>
    </div>
  )
}
