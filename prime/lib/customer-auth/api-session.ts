import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { MoreThan } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { CustomerSession } from "@/lib/database/entities/entities/CustomerSession"

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export async function createCustomerApiSession(customerId: string) {
  const token = randomBytes(32).toString("base64url")
  await (await getInitializedDataSource()).getRepository(CustomerSession).save({
    tokenHash: tokenHash(token),
    customerId,
    expiresAt: new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000),
  })
  return { token, tokenType: "Bearer", expiresIn: SESSION_LIFETIME_SECONDS }
}

export async function getCustomerFromApiRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? ""
  const match = /^Bearer ([A-Za-z0-9_-]{40,50})$/.exec(authorization)
  if (!match) return null
  const source = await getInitializedDataSource()
  const session = await source.getRepository(CustomerSession).findOne({
    where: { tokenHash: tokenHash(match[1]), expiresAt: MoreThan(new Date()) },
  })
  if (!session) return null
  return source.getRepository(Customer).findOneBy({ id: session.customerId })
}

export async function revokeCustomerApiSession(request: Request) {
  const authorization = request.headers.get("authorization") ?? ""
  const match = /^Bearer ([A-Za-z0-9_-]{40,50})$/.exec(authorization)
  if (!match) return
  await (
    await getInitializedDataSource()
  )
    .getRepository(CustomerSession)
    .delete({ tokenHash: tokenHash(match[1]) })
}
