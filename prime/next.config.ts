import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: [
    "socket.io",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
}

export default nextConfig
