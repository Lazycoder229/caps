import { getInitializedDataSource } from "@/lib/database/data-source"
import { ensurePermissionCatalog } from "@/lib/database/ensure-permission-catalog"
import { Permission } from "@/lib/database/entities/entities/Permission"
import { Role } from "@/lib/database/entities/entities/Role"
import { RolesWorkspace } from "./workspace"
import type { PermissionOption, RoleRow } from "./types"
import { requireAdministrator } from "@/lib/staff-auth/session"

export default async function RolesPage() {
  await requireAdministrator()
  try {
    await ensurePermissionCatalog()
    const source = await getInitializedDataSource()
    const [roles, permissions] = await Promise.all([
      source.getRepository(Role).find({
        relations: { permissions: true, users: true },
        order: { name: "ASC" },
      }),
      source
        .getRepository(Permission)
        .find({ order: { module: "ASC", code: "ASC" } }),
    ])
    const roleRows: RoleRow[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt.toISOString(),
      userCount: role.users.length,
      permissionIds: role.permissions.map((permission) => permission.id),
      permissionCodes: role.permissions.map((permission) => permission.code),
    }))
    const permissionOptions: PermissionOption[] = permissions.map(
      (permission) => ({
        id: permission.id,
        code: permission.code,
        module: permission.module,
        description: permission.description,
      })
    )
    return <RolesWorkspace roles={roleRows} permissions={permissionOptions} />
  } catch (error) {
    console.error("Unable to load roles and permissions:", error)
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles &amp; Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage staff roles and their access to system modules.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          Roles and permissions could not load. Check the database connection
          and apply the project migrations.
        </div>
      </main>
    )
  }
}
