import { z } from "zod"

const uuid = z.string().uuid()

export const roleSchema = z.object({
  id: uuid.or(z.literal("")),
  name: z.string().trim().min(2).max(50),
  description: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || null),
  permissionIds: z.array(uuid).max(100),
})

export const roleIdSchema = uuid

export type RoleInput = z.infer<typeof roleSchema>
