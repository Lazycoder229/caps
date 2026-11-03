import "server-only"

import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { hashPassword, verifyPassword } from "@/lib/security/password"

const emailSchema = z.string().trim().email().max(255)

export type CustomerCredentialsErrorCode =
  "invalid" | "duplicate" | "invalid_credentials" | "unavailable"

export class CustomerCredentialsError extends Error {
  constructor(
    public readonly code: CustomerCredentialsErrorCode,
    message: string
  ) {
    super(message)
    this.name = "CustomerCredentialsError"
  }
}

export async function registerCustomerAccount(input: {
  name: unknown
  email: unknown
  contactNumber?: unknown
  password: unknown
}) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      email: emailSchema,
      contactNumber: z.string().trim().max(20).optional().default(""),
      password: z.string().min(8).max(100),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new CustomerCredentialsError(
      "invalid",
      parsed.error.issues[0]?.message ?? "Check your details."
    )

  try {
    const source = await getInitializedDataSource()
    return await source.transaction(async (manager) => {
      const repository = manager.getRepository(Customer)
      if (
        await repository.findOneBy({ email: parsed.data.email.toLowerCase() })
      )
        throw new CustomerCredentialsError(
          "duplicate",
          "An account with this email already exists."
        )
      return repository.save(
        repository.create({
          id: randomUUID(),
          email: parsed.data.email.toLowerCase(),
          password: hashPassword(parsed.data.password),
          name: parsed.data.name,
          contactNumber: parsed.data.contactNumber || null,
          loyaltyPointsBalance: 0,
          isGuest: false,
          dateOfBirth: null,
          pwdIdNumber: null,
          updatedAt: null,
        })
      )
    })
  } catch (error) {
    if (error instanceof CustomerCredentialsError) throw error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    )
      throw new CustomerCredentialsError(
        "duplicate",
        "An account with this email already exists."
      )
    throw new CustomerCredentialsError(
      "unavailable",
      "Could not create the account. Please try again."
    )
  }
}

export async function authenticateCustomer(input: {
  email: unknown
  password: unknown
}) {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(100) })
    .safeParse(input)
  if (!parsed.success)
    throw new CustomerCredentialsError(
      "invalid",
      "Enter a valid email and password."
    )
  try {
    const source = await getInitializedDataSource()
    const customer = await source
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .addSelect("customer.password")
      .where("customer.email = :email", {
        email: parsed.data.email.toLowerCase(),
      })
      .andWhere("customer.isGuest = :isGuest", { isGuest: false })
      .getOne()
    if (
      !customer?.password ||
      !(await verifyPassword(parsed.data.password, customer.password))
    )
      throw new CustomerCredentialsError(
        "invalid_credentials",
        "Email or password is incorrect."
      )
    if (customer.password.startsWith("$2")) {
      customer.password = hashPassword(parsed.data.password)
      await source.getRepository(Customer).save(customer)
    }
    return customer
  } catch (error) {
    if (error instanceof CustomerCredentialsError) throw error
    console.error("Customer authentication failed:", error)
    throw new CustomerCredentialsError(
      "unavailable",
      "Could not sign in. Please try again."
    )
  }
}
