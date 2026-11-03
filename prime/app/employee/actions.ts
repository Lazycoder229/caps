"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { User } from "@/lib/database/entities/entities/User"
import { hashPassword, verifyPassword } from "@/lib/security/password"
import { requireEmployeeSession } from "@/lib/staff-auth/session"

const accountSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(100),
    email: z.email().trim().max(255).transform((value) => value.toLowerCase()),
    contactNumber: z.string().trim().max(20),
    currentPassword: z.string().max(100),
    newPassword: z.string().max(100),
  })
  .refine(
    (value) => !value.newPassword || value.newPassword.length >= 8,
    { message: "A new password must have at least 8 characters.", path: ["newPassword"] }
  )
  .refine(
    (value) => !value.newPassword || Boolean(value.currentPassword),
    { message: "Enter your current password to change it.", path: ["currentPassword"] }
  )

export type EmployeeAccountState = { ok: boolean; message: string } | null

export async function updateEmployeeAccount(
  _previous: EmployeeAccountState,
  formData: FormData
): Promise<EmployeeAccountState> {
  const staff = await requireEmployeeSession()
  const parsed = accountSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  })
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your account details." }

  try {
    const source = await getInitializedDataSource()
    const repository = source.getRepository(User)
    const user = await repository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: staff.id })
      .getOne()
    if (!user || !user.isActive)
      return { ok: false, message: "Your account is unavailable. Ask your administrator for help." }

    const duplicate = await repository.findOneBy({ email: parsed.data.email })
    if (duplicate && duplicate.id !== user.id)
      return { ok: false, message: "That email address is already in use." }
    if (
      parsed.data.newPassword &&
      !(await verifyPassword(parsed.data.currentPassword, user.password))
    )
      return { ok: false, message: "Your current password is incorrect." }

    user.name = parsed.data.name
    user.email = parsed.data.email
    user.contactNumber = parsed.data.contactNumber || null
    user.updatedAt = new Date()
    if (parsed.data.newPassword) user.password = hashPassword(parsed.data.newPassword)
    await repository.save(user)

    revalidatePath("/employee")
    revalidatePath("/employee/account")
    return { ok: true, message: "Your account details have been updated." }
  } catch (error) {
    console.error("Unable to update employee account:", error)
    return { ok: false, message: "Could not update your account. Please try again." }
  }
}
