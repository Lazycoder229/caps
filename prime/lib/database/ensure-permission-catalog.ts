import { randomUUID } from "node:crypto"
import { ACCESS_PERMISSIONS } from "./access-control"
import { getInitializedDataSource } from "./data-source"
import { Permission } from "./entities/entities/Permission"

export async function ensurePermissionCatalog() {
  const source = await getInitializedDataSource()
  await source.transaction(async (manager) => {
    const repository = manager.getRepository(Permission)
    const existing = await repository.find({ select: { id: true, code: true } })
    const existingCodes = new Set(existing.map((permission) => permission.code))
    const missing = ACCESS_PERMISSIONS.filter(
      (permission) => !existingCodes.has(permission.code)
    )
    if (missing.length) {
      await repository.insert(
        missing.map((permission) => ({ id: randomUUID(), ...permission }))
      )
    }
  })
}
