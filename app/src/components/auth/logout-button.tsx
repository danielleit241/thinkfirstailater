"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type LogoutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function LogoutButton({
  className,
  variant,
  ...props
}: LogoutButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    await authClient.signOut()
    setPending(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant={variant ?? "outline"}
      className={cn(className)}
      disabled={pending}
      onClick={handleLogout}
      {...props}
    >
      {pending ? "Đang đăng xuất..." : "Đăng xuất"}
    </Button>
  )
}
