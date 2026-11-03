import type {
  OrderStatus,
  OrderType,
} from "@/lib/database/entities/entities/enums"

export type LiveOrderItem = {
  id: string
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
}

export type LiveOrder = {
  id: string
  orderNumber: string
  orderType: OrderType
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  customerPaymentReference: string | null
  receiptNumber: string | null
  paidAt: string | null
  createdAt: string
  customerName: string | null
  customerContact: string | null
  tableNumber: string | null
  items: LiveOrderItem[]
  statusHistory: { status: string; changedAt: string }[]
}

export type CustomerOption = {
  id: string
  name: string
  contactNumber: string | null
  pointsBalance: number
}

export type OrderActionResult = {
  ok: boolean
  message: string
  paymentReferenceToken?: string | null
  receiptNumber?: string
  paidAt?: string
}
