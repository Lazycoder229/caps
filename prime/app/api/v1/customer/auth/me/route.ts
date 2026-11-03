import { NextResponse } from "next/server"
import { getCustomerFromApiRequest } from "@/lib/customer-auth/api-session"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const customer = await getCustomerFromApiRequest(request)
  if (!customer || customer.isGuest)
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    )
  return NextResponse.json(
    {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        contactNumber: customer.contactNumber,
        loyaltyPointsBalance: customer.loyaltyPointsBalance,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
