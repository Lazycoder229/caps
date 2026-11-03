"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import {
  bootstrapFirstAdministrator,
  hasAdministratorAccount,
} from "@/lib/staff-auth/admin-bootstrap"
import { createStaffSession } from "@/lib/staff-auth/session"

export type AdminSetupState = { message: string } | null

const setupSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) => value.toLowerCase()),
    employeeNumber: z.string().trim().min(1).max(20),
    password: z.string().min(12).max(100),
    confirmPassword: z.string(),
    bootstrapKey: z.string().min(1).max(200),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export async function setupFirstAdministrator(
  _previous: AdminSetupState,
  formData: FormData
): Promise<AdminSetupState> {
  const parsed = setupSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    employeeNumber: String(formData.get("employeeNumber") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    bootstrapKey: String(formData.get("bootstrapKey") ?? ""),
  })
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message ?? "Check the account details.",
    }

  try {
    if (await hasAdministratorAccount())
      return {
        message: "An administrator account already exists. Sign in instead.",
      }
    const account = {
      name: parsed.data.name,
      email: parsed.data.email,
      employeeNumber: parsed.data.employeeNumber,
      password: parsed.data.password,
      bootstrapKey: parsed.data.bootstrapKey,
    }
    const userId = await bootstrapFirstAdministrator(account)
    await createStaffSession(userId)
  } catch (error) {
    console.error("Unable to set up first administrator:", error)
    const knownMessage =
      error instanceof Error &&
      [
        "Set ADMIN_BOOTSTRAP_KEY in .env.local to a secret with at least 24 characters, then restart the app.",
        "The setup key is incorrect.",
        "Administrator setup is already in progress. Try again.",
        "An administrator account already exists. Sign in instead.",
      ].includes(error.message)
    return {
      message: knownMessage
        ? (error as Error).message
        : "Could not create the first administrator. Check the database and employee number, then try again.",
    }
  }

  redirect("/admin")
}
