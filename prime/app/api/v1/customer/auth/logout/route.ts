import { NextResponse } from "next/server"
import { revokeCustomerApiSession } from "@/lib/customer-auth/api-session"

export async function POST(request: Request) {
  await revokeCustomerApiSession(request)
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })
}
