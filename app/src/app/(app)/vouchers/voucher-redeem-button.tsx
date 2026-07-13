"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { redeemVoucherAction } from "@/server/vouchers/actions"

export function VoucherRedeemButton({
  voucherSlug,
  canAfford,
}: {
  voucherSlug: string
  canAfford: boolean
}) {
  const [result, setResult] = useState<
    "redeemed" | "already_redeemed" | "insufficient_balance" | "error" | null
  >(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRedeem() {
    // A fresh key per click — if this exact request is retried (double
    // click, dropped connection), the server treats the resend as the same
    // logical attempt via this key, never a second debit.
    const idempotencyKey = crypto.randomUUID()

    startTransition(async () => {
      try {
        const outcome = await redeemVoucherAction(voucherSlug, idempotencyKey)
        setResult(
          outcome.status === "voucher_unavailable" ? "error" : outcome.status,
        )
        if (outcome.status === "redeemed") {
          router.refresh()
        }
      } catch {
        setResult("error")
      }
    })
  }

  if (result === "redeemed" || result === "already_redeemed") {
    return (
      <p className="text-sm font-semibold text-[var(--insight-orange)]">
        Đã đổi thành công.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        onClick={handleRedeem}
        disabled={!canAfford || isPending}
        className="w-fit"
      >
        {isPending ? "Đang đổi..." : "Đổi voucher"}
      </Button>
      {result === "insufficient_balance" ? (
        <p className="text-sm text-red-400">Bạn không đủ lúa để đổi.</p>
      ) : null}
      {result === "error" ? (
        <p className="text-sm text-red-400">
          Không thể đổi voucher, vui lòng thử lại.
        </p>
      ) : null}
    </div>
  )
}
