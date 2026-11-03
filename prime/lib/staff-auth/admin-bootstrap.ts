import "server-only"

import { randomUUID, timingSafeEqual } from "node:crypto"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { Permission } from "@/lib/database/entities/entities/Permission"
import { Role } from "@/lib/database/entities/entities/Role"
import { User } from "@/lib/database/entities/entities/User"
import { ACCESS_PERMISSIONS } from "@/lib/database/access-control"
import { ensurePermissionCatalog } from "@/lib/database/ensure-permission-catalog"
import { hashPassword } from "@/lib/security/password"

export type AdminBootstrapInput = {
  name: string
  email: string
  employeeNumber: string
  password: string
  bootstrapKey: string
}

export async function hasAdministratorAccount() {
  const source = await getInitializedDataSource()
  return (
    (await source
      .getRepository(User)
      .createQueryBuilder("user")
      .innerJoin("user.role", "role")
      .where("LOWER(role.name) IN (:...names)", {
        names: ["admin", "administrator"],
      })
      .getCount()) > 0
  )
}

function matchesBootstrapKey(value: string) {
  const configuredKey = process.env.ADMIN_BOOTSTRAP_KEY
  if (!configuredKey || configuredKey.length < 24) return "not_configured"
  const submitted = Buffer.from(value)
  const expected = Buffer.from(configuredKey)
  if (submitted.length !== expected.length) return false
  return timingSafeEqual(submitted, expected)
}

export async function bootstrapFirstAdministrator(input: AdminBootstrapInput) {
  const keyStatus = matchesBootstrapKey(input.bootstrapKey)
  if (keyStatus === "not_configured")
    throw new Error(
      "Set ADMIN_BOOTSTRAP_KEY in .env.local to a secret with at least 24 characters, then restart the app."
    )
  if (!keyStatus) throw new Error("The setup key is incorrect.")

  await ensurePermissionCatalog()
  const source = await getInitializedDataSource()
  const runner = source.createQueryRunner()
  await runner.connect()
  let hasLock = false
  try {
    const lockRows = (await runner.query("SELECT GET_LOCK(?, 10) AS acquired", [
      "prime_admin_bootstrap",
    ])) as Array<{ acquired: number | string | null }>
    hasLock = Number(lockRows[0]?.acquired) === 1
    if (!hasLock)
      throw new Error("Administrator setup is already in progress. Try again.")

    await runner.startTransaction()
    const manager = runner.manager
    const userRepository = manager.getRepository(User)
    const existingAdmin =
      (await userRepository
        .createQueryBuilder("user")
        .innerJoin("user.role", "role")
        .where("LOWER(role.name) IN (:...names)", {
          names: ["admin", "administrator"],
        })
        .getCount()) > 0
    if (existingAdmin)
      throw new Error(
        "An administrator account already exists. Sign in instead."
      )

    const roleRepository = manager.getRepository(Role)
    let role = await roleRepository
      .createQueryBuilder("role")
      .leftJoinAndSelect("role.permissions", "permission")
      .where("LOWER(role.name) IN (:...names)", {
        names: ["admin", "administrator"],
      })
      .getOne()
    if (!role) {
      role = roleRepository.create({
        id: randomUUID(),
        name: "Administrator",
        description: "Built-in PRIME administrator role",
        isSystem: true,
        updatedAt: new Date(),
        permissions: [],
      })
    }

    const permissionRepository = manager.getRepository(Permission)
    const allPermissions = await permissionRepository.find()
    const requiredCodes = new Set<string>(
      ACCESS_PERMISSIONS.map((permission) => permission.code)
    )
    const administratorPermissions = allPermissions.filter((permission) =>
      requiredCodes.has(permission.code)
    )
    role.permissions = administratorPermissions
    role.updatedAt = new Date()
    await roleRepository.save(role)

    const user = userRepository.create({
      id: randomUUID(),
      roleId: role.id,
      role,
      email: input.email,
      password: hashPassword(input.password),
      name: input.name,
      contactNumber: null,
      isActive: true,
      lastLoginAt: new Date(),
      updatedAt: null,
    })
    await userRepository.save(user)

    await manager.getRepository(Employee).save({
      id: randomUUID(),
      userId: user.id,
      employeeNumber: input.employeeNumber,
      position: "Administrator",
      department: "Administration",
      rfidCardUid: null,
      dateHired: new Date().toISOString().slice(0, 10),
      dateTerminated: null,
      employmentStatus: "active",
      basicSalary: 0,
      salaryType: "monthly",
    })

    await runner.commitTransaction()
    return user.id
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction()
    throw error
  } finally {
    try {
      if (hasLock) {
        await runner.query("SELECT RELEASE_LOCK(?)", ["prime_admin_bootstrap"])
      }
    } finally {
      await runner.release()
    }
  }
}
