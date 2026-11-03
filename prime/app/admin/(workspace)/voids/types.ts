import type {
  OrderStatus,
  VoidStatus,
} from "@/lib/database/entities/entities/enums"

export type VoidRequestRow = {
  id: string
  orderId: string
  orderNumber: string
  orderStatus: OrderStatus
  customerName: string | null
  tableNumber: string | null
  total: number
  reason: string
  status: VoidStatus
  requestedAt: string
  requestedByName: string | null
  resolvedAt: string | null
  approvedByName: string | null
  resolutionNotes: string | null
}

export type CancelledOrderRow = {
  id: string
  orderId: string
  orderNumber: string
  customerName: string | null
  tableNumber: string | null
  total: number
  cancelledAt: string
  reason: string | null
  source: "cancellation" | "approved_void"
}

export type VoidableOrderOption = {
  id: string
  orderNumber: string
  status: OrderStatus
  customerName: string | null
  tableNumber: string | null
  total: number
  createdAt: string
}
