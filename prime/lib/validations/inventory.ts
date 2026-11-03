import { z } from "zod"

export const optionalIdSchema = z
  .union([z.string().uuid(), z.literal("")])
  .transform((value) => value || null)

export const inventoryItemSchema = z.object({
  id: optionalIdSchema,
  name: z.string().trim().min(1).max(150),
  categoryId: optionalIdSchema,
  unit: z.string().trim().min(1).max(30),
  reorderThreshold: z.preprocess(
    (value) => (value === null ? null : value),
    z.coerce.number().min(0).nullable()
  ),
  unitCost: z.preprocess(
    (value) => (value === null ? null : value),
    z.coerce.number().min(0).nullable()
  ),
  supplier: z.string().trim().max(150),
})

export const menuItemSchema = z.object({
  id: optionalIdSchema,
  name: z.string().trim().min(1).max(150),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(65_535),
  price: z.coerce.number().min(0),
  imageUrl: z.string().trim().max(500),
  isAvailable: z.boolean(),
  stockQuantity: z.preprocess(
    (value) => (value === "" ? null : value),
    z.preprocess(
      (value) => (value === null ? null : value),
      z.coerce.number().int().min(0).nullable()
    )
  ),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
