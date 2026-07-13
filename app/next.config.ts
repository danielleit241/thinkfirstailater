import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Giữ production build ổn định trên máy demo/CI có ít virtual memory.
  experimental: { cpus: 2 },
}

export default nextConfig
