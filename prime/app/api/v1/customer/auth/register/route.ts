import { NextResponse } from "next/server"
import {
  CustomerCredentialsError,
  registerCustomerAccount,
} from "@/lib/customer-auth/credentials"
import { createCustomerApiSession } from "@/lib/customer-auth/api-session"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customer = await registerCustomerAccount(body)
    const session = await createCustomerApiSession(customer.id)
    return NextResponse.json(
      {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          contactNumber: customer.contactNumber,
        },
        ...session,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    if (error instanceof CustomerCredentialsError) {
      const status =
        error.code === "invalid" ? 400 : error.code === "duplicate" ? 409 : 503
      return NextResponse.json(
        { error: error.message },
        { status, headers: { "Cache-Control": "no-store" } }
      )
    }
    console.error("Customer mobile registration failed:", error)
    return NextResponse.json(
      { error: "Could not create the account. Please try again." },
      { status: 503 }
    )
  }
}
