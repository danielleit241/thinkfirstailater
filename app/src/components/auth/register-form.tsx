"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Decision (documented for the report): registration surfaces "email already
// used" explicitly. Better Auth's own sign-up endpoint already reveals this
// via its error code (`USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`), so hiding it
// client-side would not close the enumeration channel — it would only make
// the demo UX worse. Accepted for this demo scope (Not Doing: no email
// verification/reset in this phase).
const DUPLICATE_EMAIL_CODE = "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    setPending(false)

    if (signUpError) {
      if (signUpError.status === 429) {
        setError("Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút.")
      } else if (
        (signUpError as { code?: string }).code === DUPLICATE_EMAIL_CODE
      ) {
        setError(
          "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.",
        )
      } else {
        setError("Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.")
      }
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <div>
        <Label htmlFor="name">Họ và tên</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

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
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--warm-light)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full justify-center"
      >
        {pending ? "Đang đăng ký..." : "Đăng ký"}
      </Button>
    </form>
  )
}
