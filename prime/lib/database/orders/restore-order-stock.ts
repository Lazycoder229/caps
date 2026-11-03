import { randomUUID } from "node:crypto"
import type { EntityManager } from "typeorm"
import { InventoryItem } from "@/lib/database/entities/entities/InventoryItem"
import { InventoryStockLog } from "@/lib/database/entities/entities/InventoryStockLog"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { Order } from "@/lib/database/entities/entities/Order"

/** Restores the exact consumed stock logs for an order within its transaction. */
export async function restoreOrderStock(order: Order, manager: EntityManager) {
  const logRepository = manager.getRepository(InventoryStockLog)
  const consumedLogs = await logRepository
    .createQueryBuilder("log")
    .setLock("pessimistic_write")
    .where("log.type = :type", { type: "consumed" })
    .andWhere("log.note LIKE :note", { note: `order-inventory:${order.id}:%` })
    .getMany()

  for (const consumedLog of consumedLogs) {
    const returnedQuantity = Math.abs(Number(consumedLog.quantityChange))
    if (!returnedQuantity) continue
    let quantityAfter: number | null = null
    if (consumedLog.inventoryItemId) {
      const item = await manager
        .getRepository(InventoryItem)
        .createQueryBuilder("ingredient")
        .setLock("pessimistic_write")
        .where("ingredient.id = :id", { id: consumedLog.inventoryItemId })
        .getOne()
      if (item) {
        item.stockQuantity = Number(item.stockQuantity) + returnedQuantity
        item.updatedAt = new Date()
        quantityAfter = Number(item.stockQuantity)
        await manager.getRepository(InventoryItem).save(item)
      }
    } else if (consumedLog.menuItemId) {
      const item = await manager
        .getRepository(MenuItem)
        .createQueryBuilder("menu")
        .setLock("pessimistic_write")
        .where("menu.id = :id", { id: consumedLog.menuItemId })
        .getOne()
      if (item?.stockQuantity !== null && item) {
        item.stockQuantity += returnedQuantity
        item.updatedAt = new Date()
        quantityAfter = item.stockQuantity
        await manager.getRepository(MenuItem).save(item)
      }
    }
    if (quantityAfter !== null) {
      await logRepository.save(
        logRepository.create({
          id: randomUUID(),
          itemType: consumedLog.itemType,
          inventoryItemId: consumedLog.inventoryItemId,
          menuItemId: consumedLog.menuItemId,
          type: "stock_in",
          quantityChange: returnedQuantity,
          quantityAfter,
          note: `Order cancelled · ${order.orderNumber}`,
          performedByStaffId: null,
        })
      )
    }
  }
}
