"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateVoucherAction } from "@/server/admin/actions"

export function VoucherStatusRow({
  voucherId,
  brand,
  title,
  initialRiceCost,
  initialActive,
}: {
  voucherId: string
  brand: string
  title: string
  initialRiceCost: number
  initialActive: boolean
}) {
  const [riceCost, setRiceCost] = useState(initialRiceCost)
  const [active, setActive] = useState(initialActive)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await updateVoucherAction(voucherId, { riceCost, active })
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex-1">
        <p className="text-sm text-white/50">{brand}</p>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <Input
        type="number"
        min={1}
        value={riceCost}
        onChange={(event) => setRiceCost(Number(event.target.value))}
        className="w-24"
      />
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Đang mở
      </label>
      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
