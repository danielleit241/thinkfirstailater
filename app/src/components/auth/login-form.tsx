"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      })

      if (signInError) {
        if (signInError.status === 429) {
          setError("Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút.")
        } else {
          // Dùng lỗi chung để không tiết lộ email nào đã có tài khoản.
          setError("Email hoặc mật khẩu không đúng.")
        }
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(
        "Không thể kết nối để đăng nhập. Vui lòng kiểm tra mạng và thử lại.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full justify-center"
      >
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  )
}
