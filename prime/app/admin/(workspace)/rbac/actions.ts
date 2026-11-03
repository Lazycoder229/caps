"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { In } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Permission } from "@/lib/database/entities/entities/Permission"
import { Role } from "@/lib/database/entities/entities/Role"
import { User } from "@/lib/database/entities/entities/User"
import { roleIdSchema, roleSchema } from "@/lib/validations/roles"
import { requireAdministrator } from "@/lib/staff-auth/session"

export async function saveRole(data: FormData) {
  await requireAdministrator()
  let permissionIds: unknown
  try {
    permissionIds = JSON.parse(String(data.get("permissionIds") ?? "[]"))
  } catch {
    return { ok: false, message: "Choose valid permissions." }
  }
  const parsed = roleSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    description: String(data.get("description") ?? ""),
    permissionIds,
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the role details.",
    }

  try {
    await (
      await getInitializedDataSource()
    ).transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role)
      const permissionRepository = manager.getRepository(Permission)
      const role = parsed.data.id
        ? await roleRepository.findOne({
            where: { id: parsed.data.id },
            relations: { permissions: true },
          })
        : roleRepository.create({ id: randomUUID(), isSystem: false })
      if (!role) throw new Error("Role not found. Refresh and try again.")
      if (role.isSystem && role.name !== parsed.data.name)
        throw new Error("The name of a system role cannot be changed.")
      const duplicate = await roleRepository.findOneBy({
        name: parsed.data.name,
      })
      if (duplicate && duplicate.id !== role.id)
        throw new Error("A role with that name already exists.")
      const permissions = parsed.data.permissionIds.length
        ? await permissionRepository.findBy({
            id: In(parsed.data.permissionIds),
          })
        : []
      if (permissions.length !== new Set(parsed.data.permissionIds).size)
        throw new Error("One or more permissions are no longer available.")
      role.name = parsed.data.name
      role.description = parsed.data.description
      role.permissions = permissions
      role.updatedAt = new Date()
      await roleRepository.save(role)
    })
    revalidatePath("/admin/rbac")
    revalidatePath("/admin/employees")
    return { ok: true, message: "Role and permissions saved." }
  } catch (error) {
    console.error("Unable to save role:", error)
    const message = error instanceof Error ? error.message : ""
    return {
      ok: false,
      message:
        message === "Role not found. Refresh and try again." ||
        message === "The name of a system role cannot be changed." ||
        message === "A role with that name already exists." ||
        message === "One or more permissions are no longer available."
          ? message
          : "Could not save the role. Check the database connection.",
    }
  }
}

export async function deleteRole(idValue: string) {
  await requireAdministrator()
  const parsed = roleIdSchema.safeParse(idValue)
  if (!parsed.success) return { ok: false, message: "Invalid role." }
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const repository = manager.getRepository(Role)
      const role = await repository.findOneBy({ id: parsed.data })
      if (!role) return { ok: false as const, message: "Role not found." }
      if (role.isSystem)
        return {
          ok: false as const,
          message: "System roles cannot be deleted.",
        }
      if (await manager.getRepository(User).existsBy({ roleId: role.id }))
        return {
          ok: false as const,
          message:
            "This role is assigned to staff. Reassign them before deleting it.",
        }
      await repository.remove(role)
      return { ok: true as const, message: "Role deleted." }
    })
    if (result.ok) {
      revalidatePath("/admin/rbac")
      revalidatePath("/admin/employees")
    }
    return result
  } catch (error) {
    console.error("Unable to delete role:", error)
    return { ok: false, message: "Could not delete the role." }
  }
}
