import Link from "next/link"
import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Đăng ký",
}

export default function RegisterPage() {
  return (
    <div>
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
        Tạo tài khoản
      </h1>
      <p className="mb-8 text-sm text-white/60">
        Đăng ký bằng email và mật khẩu để bắt đầu học.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-white/60">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-[var(--sky)]">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
