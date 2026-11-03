import { NextResponse } from "next/server"
import { getCustomerDigitalReceiptForApi } from "@/app/customer/actions"
import { getCustomerFromApiRequest } from "@/lib/customer-auth/api-session"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const customer = await getCustomerFromApiRequest(request)
  if (!customer || customer.isGuest)
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 })
  const { orderId } = await params
  const receipt = await getCustomerDigitalReceiptForApi(orderId, customer)
  if (!receipt) return NextResponse.json({ error: "This receipt is unavailable." }, { status: 404 })
  return NextResponse.json(receipt, { headers: { "Cache-Control": "no-store" } })
}
