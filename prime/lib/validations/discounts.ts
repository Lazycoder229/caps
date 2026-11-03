import { z } from "zod"
import { PROMO_TYPE } from "@/lib/database/entities/entities/enums"

export const discountIdSchema = z.string().uuid()
export const discountTypeSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1).max(100),
  percentage: z.coerce.number().gt(0).max(100),
  requiresIdVerification: z.boolean(),
  isActive: z.boolean(),
})

export const promotionSchema = z
  .object({
    id: z.string().uuid().or(z.literal("")),
    name: z.string().trim().min(1).max(150),
    description: z
      .string()
      .trim()
      .max(65535)
      .transform((value) => value || null),
    promoType: z.enum(PROMO_TYPE),
    discountValue: z.coerce.number().gt(0).max(1000000),
    minSpend: z.union([z.null(), z.coerce.number().min(0).max(1000000)]),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    usageLimit: z.union([
      z.null(),
      z.coerce.number().int().min(1).max(2147483647),
    ]),
    isActive: z.boolean(),
    menuItemIds: z.array(z.string().uuid()).max(500),
  })
  .refine((promo) => promo.endDate >= promo.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine(
    (promo) => promo.promoType !== "percentage" || promo.discountValue <= 100,
    {
      message: "Percentage promotions cannot exceed 100%.",
      path: ["discountValue"],
    }
  )
  .refine((promo) => promo.promoType !== "buy_x_get_y" || !promo.isActive, {
    message:
      "Buy X, Get Y cannot be activated because this entity has no buy/get quantity fields.",
    path: ["isActive"],
  })

export type DiscountTypeInput = z.infer<typeof discountTypeSchema>
export type PromotionInput = z.infer<typeof promotionSchema>
