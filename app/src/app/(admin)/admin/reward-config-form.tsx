"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateRewardConfigAction } from "@/server/admin/actions"

export function RewardConfigForm({ initialAmount }: { initialAmount: number }) {
  const [amount, setAmount] = useState(initialAmount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await updateRewardConfigAction(amount)
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="number"
        min={1}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        className="w-32"
      />
      <span className="text-sm text-white/60">lúa / ngày</span>
      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
