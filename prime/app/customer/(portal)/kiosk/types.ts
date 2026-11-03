export type KioskMenuItem = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  imageUrl: string | null
}

export type KioskTable = { id: string; tableNumber: string; capacity: number; status: string }

export type KioskPromotion = {
  id: string
  name: string
  promoType: "percentage" | "fixed_amount"
  discountValue: number
  minSpend: number | null
  menuItemIds: string[]
}

export type KioskDiscount = {
  id: string
  name: string
  percentage: number
  requiresIdVerification: boolean
}

export type KioskPaymentMethod = {
  id: "cash" | "gcash" | "maya" | "qrph"
  label: string
  qrImage: string | null
}
