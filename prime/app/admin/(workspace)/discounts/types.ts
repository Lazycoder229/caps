import type { PromoType } from "@/lib/database/entities/entities/enums"

export type DiscountTypeRow = {
  id: string
  name: string
  percentage: number
  requiresIdVerification: boolean
  isActive: boolean
  orderCount: number
}

export type PromotionRow = {
  id: string
  name: string
  description: string | null
  promoType: PromoType
  discountValue: number | null
  minSpend: number | null
  startDate: string
  endDate: string
  usageLimit: number | null
  usageCount: number
  isActive: boolean
  menuItemIds: string[]
  menuItemNames: string[]
  orderCount: number
}

export type MenuOption = { id: string; name: string; categoryName: string }
