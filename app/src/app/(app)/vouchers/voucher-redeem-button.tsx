"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { redeemVoucherAction } from "@/server/vouchers/actions"

export function VoucherRedeemButton({
  voucherSlug,
  voucherTitle,
  riceCost,
  canAfford,
  missingRice,
}: {
  voucherSlug: string
  voucherTitle: string
  riceCost: number
  canAfford: boolean
  missingRice: number
}) {
  const [result, setResult] = useState<
    "redeemed" | "already_redeemed" | "insufficient_balance" | "error" | null
  >(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const redeemButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreRedeemFocus = useRef(false)
  const submissionInFlight = useRef(false)
  const idempotencyKeyRef = useRef<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isConfirming) {
      confirmButtonRef.current?.focus()
      return
    }

    if (shouldRestoreRedeemFocus.current) {
      shouldRestoreRedeemFocus.current = false
      redeemButtonRef.current?.focus()
    }
  }, [isConfirming])

  function handleRedeem() {
    if (submissionInFlight.current) return
    submissionInFlight.current = true
    const idempotencyKey = idempotencyKeyRef.current ?? crypto.randomUUID()
    idempotencyKeyRef.current = idempotencyKey

    startTransition(async () => {
      try {
        const outcome = await redeemVoucherAction(voucherSlug, idempotencyKey)
        setResult(
          outcome.status === "voucher_unavailable" ? "error" : outcome.status,
        )
        idempotencyKeyRef.current = null
        setIsConfirming(false)
        if (
          outcome.status === "redeemed" ||
          outcome.status === "already_redeemed" ||
          outcome.status === "insufficient_balance"
        ) {
          router.refresh()
        }
      } catch {
        setResult("error")
      } finally {
        submissionInFlight.current = false
      }
    })
  }

  if (result === "redeemed" || result === "already_redeemed") {
    return (
      <div
        className="mt-4 grid gap-2 rounded-xl bg-[var(--seedling-soft)] p-3"
        role="status"
      >
        <p className="text-sm font-semibold text-[var(--leaf)]">
          Đổi quà thành công. Lịch sử đã được lưu.
        </p>
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--leaf)]"
          href="/vouchers/history"
        >
          Xem lịch sử đổi quà <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-2">
      <p className="sr-only" role="status">
        {isConfirming ? `Đã mở bước xác nhận đổi ${voucherTitle}.` : ""}
      </p>
      {isConfirming ? (
        <div
          className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--harvest-soft)] p-3"
          role="group"
          aria-label={`Xác nhận đổi ${voucherTitle}`}
        >
          <p className="text-sm leading-6 text-[var(--sunrise-ink)]">
            Dùng <strong>{riceCost} lúa</strong> để đổi {voucherTitle}?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              ref={confirmButtonRef}
              type="button"
              onClick={handleRedeem}
              disabled={isPending}
            >
              {isPending ? "Đang đổi..." : "Xác nhận đổi"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                idempotencyKeyRef.current = null
                shouldRestoreRedeemFocus.current = true
                setIsConfirming(false)
              }}
              disabled={isPending}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={redeemButtonRef}
          type="button"
          onClick={() => {
            setResult(null)
            idempotencyKeyRef.current = crypto.randomUUID()
            setIsConfirming(true)
          }}
          disabled={!canAfford || isPending}
          className="w-full"
        >
          {canAfford ? "Đổi quà" : `Cần thêm ${missingRice} lúa`}
        </Button>
      )}
      {result === "insufficient_balance" ? (
        <p role="alert" className="text-sm text-red-800">
          Số dư vừa thay đổi và hiện không đủ. Trang đang cập nhật lại số dư.
        </p>
      ) : null}
      {result === "error" ? (
        <p role="alert" className="text-sm text-red-800">
          Không thể đổi quà. Hãy thử lại.
        </p>
      ) : null}
      {!canAfford ? (
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[var(--leaf)] underline-offset-4 hover:underline"
          href="/catalog"
        >
          Làm hoạt động để nhận thêm lúa
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}
