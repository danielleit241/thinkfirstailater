import Link from "next/link"
import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Đăng nhập",
}

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
        Đăng nhập
      </h1>
      <p className="mb-8 text-sm text-white/60">
        Tiếp tục hành trình học tập của bạn.
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-white/60">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-[var(--sky)]">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
