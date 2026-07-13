import Link from "next/link"
import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Đăng ký",
}

export default function RegisterPage() {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[var(--leaf)]">
        Bắt đầu từ một việc nhỏ
      </p>
      <h1 className="mb-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ink)]">
        Tạo tài khoản học
      </h1>
      <p className="mb-8 text-sm leading-6 text-[var(--ink-muted)]">
        Lưu tiến độ, giữ streak và nhận lúa sau hoạt động đầu tiên của bạn.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--leaf)] underline-offset-4 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
