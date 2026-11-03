import { z } from "zod"

export const restaurantTableSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]),
  tableNumber: z.string().trim().min(1).max(20),
  capacity: z.coerce.number().int().min(1).max(100),
})

export type RestaurantTableInput = z.infer<typeof restaurantTableSchema>
