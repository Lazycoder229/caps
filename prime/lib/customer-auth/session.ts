import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MoreThan } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { CustomerSession } from "@/lib/database/entities/entities/CustomerSession"

const COOKIE_NAME = "prime_customer_session"
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createCustomerSession(customerId: string) {
  const cookieStore = await cookies()
  const previousToken = cookieStore.get(COOKIE_NAME)?.value
  if (previousToken && /^[A-Za-z0-9_-]{40,50}$/.test(previousToken))
    await (
      await getInitializedDataSource()
    )
      .getRepository(CustomerSession)
      .delete({ tokenHash: tokenHash(previousToken) })
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000)
  const hash = tokenHash(token)
  await (await getInitializedDataSource()).getRepository(CustomerSession).save({
    tokenHash: hash,
    customerId,
    expiresAt,
  })
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  })
}

export async function getCustomerSession(): Promise<Customer | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null
  const source = await getInitializedDataSource()
  const session = await source.getRepository(CustomerSession).findOne({
    where: { tokenHash: tokenHash(token), expiresAt: MoreThan(new Date()) },
  })
  if (!session) return null
  return source.getRepository(Customer).findOneBy({ id: session.customerId })
}

export async function requireCustomerSession() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")
  return customer
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token && /^[A-Za-z0-9_-]{40,50}$/.test(token))
    await (
      await getInitializedDataSource()
    )
      .getRepository(CustomerSession)
      .delete({ tokenHash: tokenHash(token) })
  cookieStore.delete(COOKIE_NAME)
}
