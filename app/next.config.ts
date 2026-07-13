import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Giữ production build ổn định trên máy demo/CI có ít virtual memory.
  experimental: { cpus: 2 },
  images: {
    // Voucher category art ships as trusted local SVGs under `public/vouchers/`.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
