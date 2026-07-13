"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateRewardConfigAction } from "@/server/admin/actions"

export function RewardConfigForm({ initialAmount }: { initialAmount: number }) {
  const [amount, setAmount] = useState(initialAmount)
  const [savedAmount, setSavedAmount] = useState(initialAmount)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await updateRewardConfigAction(amount)
        setSavedAmount(amount)
        setSuccess(true)
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
      <div className="grid gap-2">
        <Label htmlFor="daily-reward-amount">Số lúa thưởng mỗi ngày</Label>
        <Input
          id="daily-reward-amount"
          name="dailyRewardAmount"
          type="number"
          min={1}
          required
          value={amount}
          onChange={(event) => {
            setAmount(Number(event.target.value))
            setSuccess(false)
          }}
          className="w-48"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending || amount < 1 || amount === savedAmount}
      >
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {success ? (
        <p
          role="status"
          className="w-full text-sm font-semibold text-[var(--leaf)]"
        >
          Đã lưu mức thưởng mới.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </form>
  )
}
