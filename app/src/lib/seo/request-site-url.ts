import { headers } from "next/headers"

import { getSiteUrl } from "@/lib/seo/site"

export async function getSiteUrlFromRequest() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]
  const host = forwardedHost ?? requestHeaders.get("host")

  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    return getSiteUrl()
  }

  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
  const isLocalHost = /^(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host)
  const protocol =
    forwardedProtocol === "http" || isLocalHost ? "http" : "https"

  return `${protocol}://${host}`
}
