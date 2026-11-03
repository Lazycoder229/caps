"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { Role } from "@/lib/database/entities/entities/Role"
import { User } from "@/lib/database/entities/entities/User"
import { createStaffSession, destroyStaffSession } from "./session"
import { hasTerminationDatePassed } from "./termination"
import { hashPassword, verifyPassword } from "@/lib/security/password"

export type StaffAuthState = { message: string } | null

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(100),
})

async function authenticateStaff(
  formData: FormData,
  portal: "admin" | "cashier" | "employee"
): Promise<StaffAuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  if (!parsed.success) return { message: "Enter a valid email and password." }

  try {
    const source = await getInitializedDataSource()
    const user = await source
      .getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: parsed.data.email })
      .getOne()
    if (!user) {
      console.warn("Staff login email not found in application database:", {
        database: source.options.database,
        email: parsed.data.email,
      })
      return {
        message: "Email or password is incorrect, or the account is inactive.",
      }
    }
    const [role, employee, terminationPassed] = await Promise.all([
      source
        .getRepository(Role)
        .createQueryBuilder("role")
        .leftJoinAndSelect("role.permissions", "permission")
        .where("role.id = :roleId", { roleId: user.roleId })
        .getOne(),
      source.getRepository(Employee).findOneBy({ userId: user.id }),
      hasTerminationDatePassed(source, user.id),
    ])
    const permissionCodes =
      role?.permissions.map((item) => item.code) ?? []
    const permitted =
      portal === "admin"
        ? /^(admin|administrator)$/i.test(role?.name?.trim() ?? "") &&
          permissionCodes.includes("employees:manage")
        : portal === "cashier"
          ? permissionCodes.includes("orders:view")
          : Boolean(employee) &&
            !/^(admin|administrator)$/i.test(role?.name?.trim() ?? "") &&
            !permissionCodes.includes("orders:view")

    const checks = {
      userFound: true,
      userActive: Boolean(user?.isActive),
      employeeLinked: Boolean(employee),
      employeeActive: employee?.employmentStatus === "active",
      employeeNotTerminated: !terminationPassed,
      rolePermitted: permitted,
      passwordMatches: await verifyPassword(
        parsed.data.password,
        user.password
      ),
    }
    if (Object.values(checks).some((passed) => !passed)) {
      console.warn("Staff login rejected; check flags:", checks)
      return {
        message: "Email or password is incorrect, or the account is inactive.",
      }
    }

    user.lastLoginAt = new Date()
    if (user.password.startsWith("$2"))
      user.password = hashPassword(parsed.data.password)
    await source.getRepository(User).save(user)
    await createStaffSession(user.id)
  } catch (error) {
    console.error("Unable to authenticate staff account:", error)
    return {
      message:
        "Could not sign in. Check the database connection and try again.",
    }
  }

  redirect(
    portal === "admin"
      ? "/admin"
      : portal === "cashier"
        ? "/cashier"
        : "/employee"
  )
}

export async function loginCashier(
  _previous: StaffAuthState,
  formData: FormData
) {
  return authenticateStaff(formData, "cashier")
}

export async function loginAdmin(
  _previous: StaffAuthState,
  formData: FormData
) {
  return authenticateStaff(formData, "admin")
}

export async function loginEmployee(
  _previous: StaffAuthState,
  formData: FormData
) {
  return authenticateStaff(formData, "employee")
}

export async function logoutCashier() {
  await destroyStaffSession()
  redirect("/cashier/login")
}

export async function logoutAdmin() {
  await destroyStaffSession()
  redirect("/admin/login")
}

export async function logoutEmployee() {
  await destroyStaffSession()
  redirect("/employee/login")
}
