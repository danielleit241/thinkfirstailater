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
  const [savedRiceCost, setSavedRiceCost] = useState(initialRiceCost)
  const [savedActive, setSavedActive] = useState(initialActive)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isDirty = riceCost !== savedRiceCost || active !== savedActive

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await updateVoucherAction(voucherId, { riceCost, active })
        setSavedRiceCost(riceCost)
        setSavedActive(active)
        setSuccess(true)
        router.refresh()
      } catch {
        setError("Không thể lưu thay đổi, vui lòng thử lại.")
      }
    })
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--mist)] p-3"
    >
      <div className="flex-1">
        <p className="text-sm text-[var(--ink-soft)]">{brand}</p>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <Input
        aria-label={`Giá lúa của ${title}`}
        name={`riceCost-${voucherId}`}
        type="number"
        min={1}
        required
        value={riceCost}
        onChange={(event) => {
          setRiceCost(Number(event.target.value))
          setSuccess(false)
        }}
        className="w-24"
      />
      <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--ink-muted)]">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => {
            setActive(event.target.checked)
            setSuccess(false)
          }}
        />
        Đang mở
      </label>
      <Button type="submit" disabled={isPending || !isDirty || riceCost < 1}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </Button>
      {success ? (
        <p
          role="status"
          className="w-full text-sm font-semibold text-[var(--leaf)]"
        >
          Đã lưu thay đổi cho {title}.
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
