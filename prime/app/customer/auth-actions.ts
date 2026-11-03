"use server"

import { redirect } from "next/navigation"
import {
  authenticateCustomer,
  CustomerCredentialsError,
  registerCustomerAccount,
} from "@/lib/customer-auth/credentials"
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth/session"

export type CustomerAuthState = { message: string } | null

function customerReturnTo(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : ""
  if (!raw) return "/customer/dashboard"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/customer/dashboard"
  try {
    const url = new URL(raw, "http://prime.local")
    if (
      url.origin !== "http://prime.local" ||
      url.pathname !== "/customer/kiosk"
    )
      return "/customer/dashboard"
    const tableId = url.searchParams.get("tableId")
    if (!tableId) return "/customer/kiosk"
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      tableId
    )
      ? `/customer/kiosk?tableId=${encodeURIComponent(tableId)}`
      : "/customer/dashboard"
  } catch {
    return "/customer/dashboard"
  }
}

export async function registerCustomer(
  _previous: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  try {
    const password = String(formData.get("password") ?? "")
    if (password !== String(formData.get("confirmPassword") ?? ""))
      return { message: "Passwords do not match." }
    const customer = await registerCustomerAccount({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? "").toLowerCase(),
      contactNumber: String(formData.get("contactNumber") ?? ""),
      password,
    })
    await createCustomerSession(customer.id)
    redirect(customerReturnTo(formData.get("returnTo")))
  } catch (error) {
    if (error instanceof CustomerCredentialsError)
      return { message: error.message }
    throw error
  }
}

export async function loginCustomer(
  _previous: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  try {
    const customer = await authenticateCustomer({
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
    })
    await createCustomerSession(customer.id)
    redirect(customerReturnTo(formData.get("returnTo")))
  } catch (error) {
    if (error instanceof CustomerCredentialsError)
      return { message: error.message }
    throw error
  }
}

export async function logoutCustomer() {
  await destroyCustomerSession()
  redirect("/customer/login")
}
