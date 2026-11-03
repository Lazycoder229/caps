"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import type { EntityManager } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderStatusHistory } from "@/lib/database/entities/entities/OrderStatusHistory"
import { OrderVoid } from "@/lib/database/entities/entities/OrderVoid"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { restoreOrderStock } from "@/lib/database/orders/restore-order-stock"
import {
  createVoidRequestSchema,
  resolveVoidSchema,
} from "@/lib/validations/voids"

const activeStatuses = ["pending", "preparing", "ready", "served"] as const

function revalidateVoidRecords() {
  revalidatePath("/admin/voids")
  revalidatePath("/admin/orders")
  revalidatePath("/admin/inventory")
  revalidatePath("/admin/tables")
  revalidatePath("/admin")
}

async function applyApprovedVoid(order: Order, manager: EntityManager) {
  if (["pending", "preparing", "ready", "served"].includes(order.status))
    await restoreOrderStock(order, manager)

  order.status = "cancelled"
  order.updatedAt = new Date()
  await manager.getRepository(Order).save(order)
  await manager.getRepository(OrderStatusHistory).save(
    manager.getRepository(OrderStatusHistory).create({
      id: randomUUID(),
      orderId: order.id,
      status: "cancelled",
      changedByStaffId: null,
    })
  )

  if (order.tableId) {
    const tableRepository = manager.getRepository(RestaurantTable)
    const table = await tableRepository.findOneBy({ id: order.tableId })
    if (table) {
      const otherActiveOrder = await manager
        .getRepository(Order)
        .createQueryBuilder("other")
        .where("other.tableId = :tableId", { tableId: table.id })
        .andWhere("other.id != :orderId", { orderId: order.id })
        .andWhere("other.status IN (:...statuses)", {
          statuses: [...activeStatuses],
        })
        .getOne()
      if (!otherActiveOrder) {
        table.status = "available"
        table.occupiedAt = null
        await tableRepository.save(table)
      }
    }
  }
}

export async function requestOrderVoid(data: FormData) {
  const parsed = createVoidRequestSchema.safeParse({
    orderId: String(data.get("orderId") ?? ""),
    reason: String(data.get("reason") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the void request.",
    }

  try {
    const source = await getInitializedDataSource()
    const message = await source.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder("order")
        .setLock("pessimistic_write")
        .where("order.id = :id", { id: parsed.data.orderId })
        .getOne()
      if (!order || order.adminHiddenAt)
        throw new Error("Order not found. Refresh the list.")
      if (order.status === "cancelled")
        throw new Error("Cancelled orders cannot be voided again.")
      const existingRequest = await manager
        .getRepository(OrderVoid)
        .findOneBy({ orderId: order.id, status: "pending" })
      if (existingRequest)
        throw new Error("This order already has a pending void request.")

      const settings = await manager
        .getRepository(SystemSetting)
        .findOne({ where: {} })
      const requiresApproval = settings?.managerApprovalForVoids ?? true
      const voidRequest = manager.getRepository(OrderVoid).create({
        id: randomUUID(),
        orderId: order.id,
        requestedByStaffId: null,
        approvedByStaffId: null,
        reason: parsed.data.reason,
        status: requiresApproval ? "pending" : "approved",
        resolvedAt: requiresApproval ? null : new Date(),
        resolutionNotes: requiresApproval
          ? null
          : "Automatically approved because manager approval for voids is disabled.",
      })
      await manager.getRepository(OrderVoid).save(voidRequest)
      if (!requiresApproval) await applyApprovedVoid(order, manager)
      return requiresApproval
        ? `Void request submitted for ${order.orderNumber}. Manager approval is required.`
        : `Void approved and ${order.orderNumber} was cancelled.`
    })
    revalidateVoidRecords()
    return { ok: true, message }
  } catch (error) {
    console.error("Unable to submit order void:", error)
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Order not found. Refresh the list.",
      "Cancelled orders cannot be voided again.",
      "This order already has a pending void request.",
    ]
    return {
      ok: false,
      message: known.includes(message)
        ? message
        : "Could not submit void request. Check the database connection.",
    }
  }
}

export async function resolveOrderVoid(data: FormData) {
  const parsed = resolveVoidSchema.safeParse({
    id: String(data.get("id") ?? ""),
    status: String(data.get("status") ?? ""),
    resolutionNotes: String(data.get("resolutionNotes") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Choose a valid resolution.",
    }

  try {
    const source = await getInitializedDataSource()
    const message = await source.transaction(async (manager) => {
      const voidRequest = await manager
        .getRepository(OrderVoid)
        .createQueryBuilder("voidRequest")
        .setLock("pessimistic_write")
        .where("voidRequest.id = :id", { id: parsed.data.id })
        .getOne()
      if (!voidRequest) throw new Error("Void request not found.")
      if (voidRequest.status !== "pending")
        throw new Error("This void request has already been resolved.")
      if (parsed.data.status === "approved") {
        const order = await manager
          .getRepository(Order)
          .createQueryBuilder("order")
          .setLock("pessimistic_write")
          .where("order.id = :id", { id: voidRequest.orderId })
          .getOne()
        if (!order || order.status === "cancelled")
          throw new Error("The order is missing or already cancelled.")
        await applyApprovedVoid(order, manager)
      }
      voidRequest.status = parsed.data.status
      voidRequest.approvedByStaffId = null
      voidRequest.resolvedAt = new Date()
      voidRequest.resolutionNotes = parsed.data.resolutionNotes
      await manager.getRepository(OrderVoid).save(voidRequest)
      return parsed.data.status === "approved"
        ? "Void request approved. The order was cancelled and the history was updated."
        : "Void request rejected. The order was left unchanged."
    })
    revalidateVoidRecords()
    return { ok: true, message }
  } catch (error) {
    console.error("Unable to resolve order void:", error)
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Void request not found.",
      "This void request has already been resolved.",
      "The order is missing or already cancelled.",
    ]
    return {
      ok: false,
      message: known.includes(message)
        ? message
        : "Could not resolve void request. Check the database connection.",
    }
  }
}
