import { z } from "zod"
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
} from "@/lib/database/entities/entities/enums"

export const orderIdSchema = z.string().uuid()
export const orderStatusSchema = z.enum(ORDER_STATUS)

export const createAdminOrderSchema = z.object({
  orderType: z.enum(["counter", "qr"]),
  paymentMethod: z.enum(PAYMENT_METHOD),
  tableId: z.string().uuid().nullable(),
  customerName: z.string().trim().max(100).nullable(),
  customerContact: z.string().trim().max(20).nullable(),
  customerId: z.string().uuid().nullable(),
  discountTypeId: z.string().uuid().nullable(),
  discountHolderName: z.string().trim().max(100).nullable(),
  discountIdNumber: z.string().trim().max(50).nullable(),
  promotionId: z.string().uuid().nullable(),
  lines: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
        notes: z.string().trim().max(255).nullable(),
      })
    )
    .min(1)
    .max(50),
})

export type CreateAdminOrderInput = z.infer<typeof createAdminOrderSchema>
