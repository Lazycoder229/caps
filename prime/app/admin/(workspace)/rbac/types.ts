export type PermissionOption = {
  id: string
  code: string
  module: string
  description: string | null
}

export type RoleRow = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: string
  userCount: number
  permissionIds: string[]
  permissionCodes: string[]
}
