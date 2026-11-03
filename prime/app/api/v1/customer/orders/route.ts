import { NextResponse } from "next/server"
import { createCustomerOrderForApi } from "@/app/customer/actions"
import { getCustomerFromApiRequest } from "@/lib/customer-auth/api-session"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const customer = await getCustomerFromApiRequest(request)
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid order request." }, { status: 400 })
  const result = await createCustomerOrderForApi(
    body,
    customer && !customer.isGuest ? customer : null
  )
  return NextResponse.json(result, { status: result.ok ? 201 : 400, headers: { "Cache-Control": "no-store" } })
}
