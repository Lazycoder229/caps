import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MoreThan } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { StaffSession } from "@/lib/database/entities/entities/StaffSession"
import { User } from "@/lib/database/entities/entities/User"
import { hasTerminationDatePassed } from "./termination"

const COOKIE_NAME = "prime_staff_session"
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12

export type StaffIdentity = {
  id: string
  employeeId: string
  name: string
  email: string
  roleName: string
  permissionCodes: string[]
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function isToken(token: string | undefined): token is string {
  return !!token && /^[A-Za-z0-9_-]{40,50}$/.test(token)
}

export async function createStaffSession(userId: string) {
  const cookieStore = await cookies()
  const previousToken = cookieStore.get(COOKIE_NAME)?.value
  const source = await getInitializedDataSource()
  if (isToken(previousToken))
    await source.getRepository(StaffSession).delete({
      tokenHash: tokenHash(previousToken),
    })

  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000)
  await source.getRepository(StaffSession).save({
    tokenHash: tokenHash(token),
    userId,
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

export async function getStaffSession(): Promise<StaffIdentity | null> {
  return getStaffSessionFromToken((await cookies()).get(COOKIE_NAME)?.value)
}

export async function getStaffSessionFromToken(
  token: string | undefined
): Promise<StaffIdentity | null> {
  if (!isToken(token)) return null
  const source = await getInitializedDataSource()
  const session = await source.getRepository(StaffSession).findOne({
    where: { tokenHash: tokenHash(token), expiresAt: MoreThan(new Date()) },
  })
  if (!session) return null

  const user = await source.getRepository(User).findOne({
    where: { id: session.userId, isActive: true },
    relations: { role: { permissions: true }, employee: true },
  })
  if (
    !user ||
    !user.employee ||
    user.employee.employmentStatus !== "active" ||
    (await hasTerminationDatePassed(source, user.id))
  )
    return null

  return {
    id: user.id,
    employeeId: user.employee.id,
    name: user.name,
    email: user.email,
    roleName: user.role?.name ?? "",
    permissionCodes:
      user.role?.permissions.map((permission) => permission.code) ?? [],
  }
}

export async function requireEmployeeSession() {
  const staff = await getStaffSession()
  if (!staff) redirect("/employee/login")
  if (/^(admin|administrator)$/i.test(staff.roleName.trim()))
    redirect("/admin")
  if (staff.permissionCodes.includes("orders:view")) redirect("/cashier")
  return staff
}

export async function requireStaffPermission(
  permissionCode: string,
  loginPath: "/admin/login" | "/cashier/login"
) {
  const staff = await getStaffSession()
  if (!staff) redirect(loginPath)
  if (!staff.permissionCodes.includes(permissionCode))
    redirect(loginPath === "/admin/login" ? "/cashier" : "/admin")
  return staff
}

export async function requireAdministrator() {
  const staff = await requireStaffPermission("employees:manage", "/admin/login")
  if (!/^(admin|administrator)$/i.test(staff.roleName.trim()))
    redirect("/admin/login")
  return staff
}

export async function destroyStaffSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (isToken(token))
    await (
      await getInitializedDataSource()
    )
      .getRepository(StaffSession)
      .delete({ tokenHash: tokenHash(token) })
  cookieStore.delete(COOKIE_NAME)
}
