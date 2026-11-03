"use server"

import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { publishAdminOrderChange } from "@/lib/realtime/order-events"
import { Order } from "@/lib/database/entities/entities/Order"
import { Payment } from "@/lib/database/entities/entities/Payment"

export type CustomerReferenceResult = { ok: boolean; message: string }

export async function submitCustomerPaymentReference(
  token: string,
  submittedReference: string
): Promise<CustomerReferenceResult> {
  if (!/^[0-9a-f-]{36}$/i.test(token))
    return { ok: false, message: "Invalid payment link." }
  const reference = submittedReference.trim()
  if (!reference || reference.length > 100)
    return {
      ok: false,
      message: "Enter a reference number up to 100 characters.",
    }

  try {
    const source = await getInitializedDataSource()
    const orderId = await source.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder("order")
        .setLock("pessimistic_write")
        .where("order.paymentReferenceToken = :token", { token })
        .getOne()
      if (!order || order.adminHiddenAt)
        throw new Error("This payment link is invalid or unavailable.")
      if (
        !order.paymentMethod ||
        !["gcash", "maya", "qrph"].includes(order.paymentMethod)
      )
        throw new Error("This order does not accept an e-wallet reference.")
      if (order.paymentStatus !== "pending" || order.status === "cancelled")
        throw new Error("This order is no longer awaiting payment.")

      const normalize = (value: string) =>
        value.trim().replace(/\s+/g, "").toUpperCase()
      const [existingPayment, existingOrder] = await Promise.all([
        manager.getRepository(Payment).findOneBy({
          paymentMethod: order.paymentMethod as Payment["paymentMethod"],
          referenceNumber: reference,
        }),
        manager
          .getRepository(Order)
          .createQueryBuilder("other")
          .where("other.id != :orderId", { orderId: order.id })
          .andWhere("other.paymentMethod = :method", {
            method: order.paymentMethod,
          })
          .andWhere("other.customerPaymentReference IS NOT NULL")
          .getMany(),
      ])
      if (
        existingPayment ||
        existingOrder.some(
          (other) =>
            normalize(other.customerPaymentReference ?? "") ===
            normalize(reference)
        )
      )
        throw new Error("This reference number has already been submitted.")

      order.customerPaymentReference = reference
      order.updatedAt = new Date()
      await manager.getRepository(Order).save(order)
      return order.id
    })
    await publishAdminOrderChange(orderId)
    revalidatePath("/admin/orders")
    return {
      ok: true,
      message: "Reference submitted. Staff will verify your payment.",
    }
  } catch (error) {
    const known =
      error instanceof Error &&
      (error.message === "This payment link is invalid or unavailable." ||
        error.message === "This order does not accept an e-wallet reference." ||
        error.message === "This order is no longer awaiting payment." ||
        error.message === "This reference number has already been submitted.")
    return {
      ok: false,
      message: known
        ? (error as Error).message
        : "Could not submit the reference. Please try again.",
    }
  }
}
