"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { In } from "typeorm"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Order } from "@/lib/database/entities/entities/Order"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { restaurantTableSchema } from "@/lib/validations/tables"

const activeStatuses = ["pending", "preparing", "ready", "served"] as const

export async function saveRestaurantTable(data: FormData) {
  const parsed = restaurantTableSchema.safeParse({
    id: String(data.get("id") ?? ""),
    tableNumber: String(data.get("tableNumber") ?? ""),
    capacity: String(data.get("capacity") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: "Enter a table number and valid seat capacity.",
    }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const repo = manager.getRepository(RestaurantTable)
      const table = parsed.data.id
        ? await repo.findOneBy({ id: parsed.data.id })
        : repo.create({
            id: randomUUID(),
            status: "available",
            occupiedAt: null,
          })
      if (!table) throw new Error("Table not found. Refresh and try again.")
      table.tableNumber = parsed.data.tableNumber
      table.capacity = parsed.data.capacity
      // Store a stable route instead of writing into /public. Serverless
      // deployments such as Vercel have a read-only app filesystem.
      table.qrCodeUrl = `/api/tables/${table.id}/qr`
      await repo.save(table)
    })
    revalidatePath("/admin/tables")
    revalidatePath("/admin/orders")
    return { ok: true, message: "Table saved." }
  } catch (error) {
    console.error("Unable to save table:", error)
    if (
      error instanceof Error &&
      error.message === "Table not found. Refresh and try again."
    )
      return { ok: false, message: error.message }
    if (
      error instanceof Error &&
      (error.message.includes("ER_DUP_ENTRY") ||
        error.message.toLowerCase().includes("duplicate"))
    )
      return { ok: false, message: "That table number already exists." }
    return {
      ok: false,
      message: "Could not save the table. Check the database connection.",
    }
  }
}

export async function setRestaurantTableStatus(data: FormData) {
  const id = z
    .string()
    .uuid()
    .safeParse(String(data.get("id") ?? ""))
  const nextStatus = z
    .enum(["available", "reserved"])
    .safeParse(String(data.get("status") ?? ""))
  if (!id.success || !nextStatus.success)
    return { ok: false, message: "Choose a valid table status." }
  try {
    await (
      await getInitializedDataSource()
    ).transaction(async (manager) => {
      const repo = manager.getRepository(RestaurantTable)
      const table = await repo
        .createQueryBuilder("table")
        .setLock("pessimistic_write")
        .where("table.id = :id", { id: id.data })
        .getOne()
      if (!table) throw new Error("Table not found. Refresh and try again.")
      const hasActiveOrder = await manager
        .getRepository(Order)
        .existsBy({ tableId: table.id, status: In([...activeStatuses]) })
      if (hasActiveOrder)
        throw new Error(
          "This table has an active order. Its status is managed by Live Orders."
        )
      table.status = nextStatus.data
      if (nextStatus.data === "available") table.occupiedAt = null
      await repo.save(table)
    })
    revalidatePath("/admin/tables")
    revalidatePath("/admin/orders")
    return {
      ok: true,
      message:
        nextStatus.data === "reserved"
          ? "Table marked as reserved."
          : "Table marked as available.",
    }
  } catch (error) {
    console.error("Unable to update table status:", error)
    const message = error instanceof Error ? error.message : ""
    return {
      ok: false,
      message:
        message === "Table not found. Refresh and try again." ||
        message.startsWith("This table has an active order.")
          ? message
          : "Could not update table status.",
    }
  }
}

export async function deleteRestaurantTable(data: FormData) {
  const id = z
    .string()
    .uuid()
    .safeParse(String(data.get("id") ?? ""))
  if (!id.success) return { ok: false, message: "Invalid table." }
  try {
    await (
      await getInitializedDataSource()
    ).transaction(async (manager) => {
      const repo = manager.getRepository(RestaurantTable)
      const table = await repo
        .createQueryBuilder("table")
        .setLock("pessimistic_write")
        .where("table.id = :id", { id: id.data })
        .getOne()
      if (!table) throw new Error("Table not found. Refresh and try again.")
      if (await manager.getRepository(Order).existsBy({ tableId: table.id }))
        throw new Error("This table has order history and cannot be deleted.")
      if (
        await manager.getRepository(Reservation).existsBy({ tableId: table.id })
      )
        throw new Error("This table has reservations and cannot be deleted.")
      await repo.remove(table)
    })
    revalidatePath("/admin/tables")
    revalidatePath("/admin/orders")
    return { ok: true, message: "Table deleted." }
  } catch (error) {
    console.error("Unable to delete table:", error)
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Table not found. Refresh and try again.",
      "This table has order history and cannot be deleted.",
      "This table has reservations and cannot be deleted.",
    ]
    return {
      ok: false,
      message: known.includes(message)
        ? message
        : "Could not delete the table.",
    }
  }
}
