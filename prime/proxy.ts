import { NextResponse, type NextRequest } from "next/server"

const localExpoOrigins = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
])

function allowedOrigin(request: NextRequest, origin: string | null) {
  if (!origin) return null

  const configuredOrigins = (process.env.CUSTOMER_MOBILE_WEB_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
  const allowed = new Set(configuredOrigins)
  if (process.env.NODE_ENV !== "production") {
    for (const localOrigin of localExpoOrigins) allowed.add(localOrigin)

    // Also allow Expo web opened from the computer's LAN address on port 8081.
    try {
      const parsedOrigin = new URL(origin)
      if (
        parsedOrigin.protocol === "http:" &&
        parsedOrigin.port === "8081" &&
        parsedOrigin.hostname === request.nextUrl.hostname
      ) {
        return origin
      }
    } catch {
      return null
    }
  }

  return allowed.has(origin) ? origin : null
}

export function proxy(request: NextRequest) {
  const origin = allowedOrigin(request, request.headers.get("origin"))
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 })
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type")
      response.headers.set("Access-Control-Max-Age", "600")
      response.headers.set("Vary", "Origin")
    }
    return response
  }

  const response = NextResponse.next()
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Vary", "Origin")
  }
  return response
}

export const config = {
  matcher: "/api/v1/customer/:path*",
}
