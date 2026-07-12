const FALLBACK_SITE_URL = "http://localhost:5173"

export const SITE = {
  name: "Think First, AI Later",
  shortName: "Think First",
  defaultDescription:
    "Nền tảng giáo dục giúp người học hình thành tư duy độc lập trước khi cộng tác với AI.",
  locale: "vi_VN",
  language: "vi",
} as const

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (!configuredUrl) {
    return FALLBACK_SITE_URL
  }

  try {
    return new URL(configuredUrl).origin
  } catch {
    return FALLBACK_SITE_URL
  }
}
