"use server"

import { headers as nextHeaders } from "next/headers"

import { requireSession } from "@/server/auth/guards"
import { redeemVoucherSchema } from "./schemas"
import { redeemVoucher } from "./service"

/**
 * Server Action for redeeming a mock voucher. `idempotencyKey` is generated
 * client-side once per redeem attempt (see the voucher catalog UI) and
 * resent unchanged if the user double-clicks/retries after a dropped
 * connection — the DB-level unique constraint on `(userId, idempotencyKey)`
 * in `redeemVoucher` is what actually prevents a duplicate debit, this
 * action just forwards the caller's real session id, never a client-
 * supplied userId.
 */
export async function redeemVoucherAction(
  voucherSlug: string,
  idempotencyKey: string,
) {
  const session = await requireSession(await nextHeaders())
  const input = redeemVoucherSchema.parse({ voucherSlug, idempotencyKey })

  return redeemVoucher(session.user.id, input.voucherSlug, input.idempotencyKey)
}
