"use client"

import { useTransition } from "react"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  createAdminOrder,
  markOrderPaymentReceived,
  updateOrderStatus,
} from "../actions"
import type { OrderStatus } from "@/lib/database/entities/entities/enums"
import type { OrderActionResult } from "../types"

export function useOrders() {
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  async function moveOrder(
    orderId: string,
    orderNumber: string,
    status: OrderStatus,
    onOptimisticUpdate?: () => void,
    onRollback?: () => void
  ) {
    if (status === "cancelled") {
      const approved = await confirm({
        title: "Cancel this order?",
        description: `Cancel ${orderNumber}? If inventory was already deducted, the consumed menu and ingredient stock will be restored automatically.`,
        confirmLabel: "Cancel order",
        destructive: true,
      })
      if (!approved) return
    }

    onOptimisticUpdate?.()
    startTransition(async () => {
      try {
        const result = await updateOrderStatus(orderId, status)
        toast(result.ok ? "success" : "error", result.message)
        if (!result.ok) onRollback?.()
      } catch {
        onRollback?.()
        toast(
          "error",
          "Could not update the order",
          "Check the connection and try again."
        )
      }
    })
  }

  function markPaymentReceived(
    orderId: string,
    referenceNumber: string
  ): Promise<OrderActionResult> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await markOrderPaymentReceived(
            orderId,
            referenceNumber
          )
          toast(result.ok ? "success" : "error", result.message)
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not confirm payment",
            "Check the connection and try again."
          )
          resolve({
            ok: false,
            message:
              "Could not confirm payment. Check the connection and try again.",
          })
        }
      })
    )
  }

  function createOrder(formData: FormData): Promise<OrderActionResult> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await createAdminOrder(formData)
          toast(
            result.ok ? "success" : "error",
            result.ok ? "Order created" : "Could not create order",
            result.message
          )
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not create order",
            "Check the database connection and try again."
          )
          resolve({ ok: false, message: "Could not create order." })
        }
      })
    )
  }

  return { pending, moveOrder, createOrder, markPaymentReceived }
}
