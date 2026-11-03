"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import type { EntityManager } from "typeorm"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { InventoryItem } from "@/lib/database/entities/entities/InventoryItem"
import { InventoryStockLog } from "@/lib/database/entities/entities/InventoryStockLog"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { MenuItemIngredient } from "@/lib/database/entities/entities/MenuItemIngredient"
import { Order } from "@/lib/database/entities/entities/Order"
import { Delivery } from "@/lib/database/entities/entities/Delivery"
import { OrderItem } from "@/lib/database/entities/entities/OrderItem"
import { OrderStatusHistory } from "@/lib/database/entities/entities/OrderStatusHistory"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { restoreOrderStock } from "@/lib/database/orders/restore-order-stock"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { OrderDiscount } from "@/lib/database/entities/entities/OrderDiscount"
import { OrderPromotion } from "@/lib/database/entities/entities/OrderPromotion"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import { Payment } from "@/lib/database/entities/entities/Payment"
import { awardOrderLoyaltyPoints } from "@/lib/database/loyalty/award-order-points"
import { dateOnlyInManila } from "@/lib/dates/date-only"
import { publishAdminOrderChange } from "@/lib/realtime/order-events"
import {
  type PaymentMethod,
  type OrderStatus,
} from "@/lib/database/entities/entities/enums"
import {
  createAdminOrderSchema,
  orderIdSchema,
  orderStatusSchema,
} from "@/lib/validations/orders"
import type { OrderActionResult } from "./types"

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["completed"],
  completed: [],
  cancelled: [],
}

function revalidateOrders() {
  revalidatePath("/admin/orders")
  revalidatePath("/cashier/orders")
  revalidatePath("/admin/inventory")
  revalidatePath("/admin/tables")
  revalidatePath("/admin")
  revalidatePath("/admin/loyalty")
}

export async function createAdminOrder(
  formData: FormData
): Promise<OrderActionResult> {
  let rawLines: unknown
  try {
    rawLines = JSON.parse(String(formData.get("lines") ?? ""))
  } catch {
    return { ok: false, message: "Add at least one valid menu item." }
  }
  const parsed = createAdminOrderSchema.safeParse({
    orderType: formData.get("orderType"),
    paymentMethod: formData.get("paymentMethod"),
    tableId: formData.get("tableId") ? String(formData.get("tableId")) : null,
    customerName: formData.get("customerName")
      ? String(formData.get("customerName"))
      : null,
    customerContact: formData.get("customerContact")
      ? String(formData.get("customerContact"))
      : null,
    customerId: formData.get("customerId")
      ? String(formData.get("customerId"))
      : null,
    discountTypeId: formData.get("discountTypeId")
      ? String(formData.get("discountTypeId"))
      : null,
    discountHolderName: formData.get("discountHolderName")
      ? String(formData.get("discountHolderName"))
      : null,
    discountIdNumber: formData.get("discountIdNumber")
      ? String(formData.get("discountIdNumber"))
      : null,
    promotionId: formData.get("promotionId")
      ? String(formData.get("promotionId"))
      : null,
    lines: rawLines,
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the order details.",
    }

  try {
    const dataSource = await getInitializedDataSource()
    const createdOrder = await dataSource.transaction(async (manager) => {
      const menuRepo = manager.getRepository(MenuItem)
      const uniqueIds = [
        ...new Set(parsed.data.lines.map((line) => line.menuItemId)),
      ]
      const menus = await menuRepo
        .createQueryBuilder("menu")
        .setLock("pessimistic_write")
        .where("menu.id IN (:...ids)", { ids: uniqueIds })
        .andWhere("menu.isAvailable = :available", { available: true })
        .getMany()
      if (menus.length !== uniqueIds.length)
        throw new Error(
          "One or more menu items are unavailable. Refresh and try again."
        )
      const menuById = new Map(menus.map((menu) => [menu.id, menu]))

      const settings = await manager
        .getRepository(SystemSetting)
        .findOne({ where: {} })
      const enabledPaymentMethods: Record<PaymentMethod, boolean> = {
        cash: settings?.paymentCashEnabled !== false,
        gcash: settings?.paymentGcashEnabled !== false,
        maya: settings?.paymentMayaEnabled !== false,
        qrph: settings?.paymentQrphEnabled !== false,
        card: false,
        other: false,
      }
      if (!enabledPaymentMethods[parsed.data.paymentMethod])
        throw new Error(
          "That payment method is disabled in System Settings. Choose an enabled method."
        )
      if (
        parsed.data.orderType === "qr" &&
        settings?.requireTableSelection &&
        !parsed.data.tableId
      )
        throw new Error("Select a table for this QR order.")
      if (parsed.data.tableId) {
        const table = await manager
          .getRepository(RestaurantTable)
          .createQueryBuilder("table")
          .setLock("pessimistic_write")
          .where("table.id = :id", { id: parsed.data.tableId })
          .getOne()
        if (!table || table.status !== "available")
          throw new Error(
            "That table is no longer available. Choose another table."
          )
      }

      let customerId: string | null = null
      if (parsed.data.customerId) {
        const customer = await manager
          .getRepository(Customer)
          .createQueryBuilder("customer")
          .setLock("pessimistic_write")
          .where("customer.id = :id", { id: parsed.data.customerId })
          .getOne()
        if (!customer)
          throw new Error(
            "Selected customer no longer exists. Refresh and try again."
          )
        customerId = customer.id
      } else if (parsed.data.customerName) {
        const customer = await manager.getRepository(Customer).save(
          manager.getRepository(Customer).create({
            id: randomUUID(),
            name: parsed.data.customerName,
            contactNumber: parsed.data.customerContact || null,
            email: null,
            password: null,
            loyaltyPointsBalance: 0,
            isGuest: true,
            dateOfBirth: null,
            pwdIdNumber: null,
            updatedAt: null,
          })
        )
        customerId = customer.id
      }

      const grouped = new Map<string, { quantity: number; notes: string[] }>()
      for (const line of parsed.data.lines) {
        const existing = grouped.get(line.menuItemId) ?? {
          quantity: 0,
          notes: [],
        }
        existing.quantity += line.quantity
        if (line.notes) existing.notes.push(line.notes)
        if (existing.quantity > 999)
          throw new Error(
            "The total quantity for a menu item cannot exceed 999."
          )
        grouped.set(line.menuItemId, existing)
      }
      const itemRows = [...grouped].map(([menuItemId, line]) => {
        const menu = menuById.get(menuItemId)!
        const unitPrice = Number(menu.price)
        return {
          id: randomUUID(),
          menuItemId,
          quantity: line.quantity,
          unitPrice,
          subtotal: Math.round(unitPrice * line.quantity * 100) / 100,
          notes: line.notes.join(" · ").slice(0, 255) || null,
        }
      })
      const subtotal =
        Math.round(
          itemRows.reduce((sum, line) => sum + line.subtotal, 0) * 100
        ) / 100
      let discountAmount = 0
      let discountType: DiscountType | null = null
      if (parsed.data.discountTypeId) {
        if (settings && !settings.seniorPwdDiscountEnabled)
          throw new Error("Discounts are disabled in System Settings.")
        discountType = await manager
          .getRepository(DiscountType)
          .findOneBy({ id: parsed.data.discountTypeId, isActive: true })
        if (!discountType)
          throw new Error("That discount type is no longer available.")
        if (!parsed.data.discountHolderName)
          throw new Error("Enter the discount holder name.")
        if (
          discountType.requiresIdVerification &&
          !parsed.data.discountIdNumber
        )
          throw new Error("Enter the required discount ID number.")
        discountAmount =
          Math.round(
            ((subtotal * Number(discountType.percentage)) / 100) * 100
          ) / 100
      }
      let promo: Promotion | null = null
      let promoDiscountAmount = 0
      if (parsed.data.promotionId) {
        const promotionRepository = manager.getRepository(Promotion)
        promo = await promotionRepository
          .createQueryBuilder("promo")
          .setLock("pessimistic_write")
          .where("promo.id = :id", { id: parsed.data.promotionId })
          .getOne()
        const promoItems = promo
          ? await promotionRepository
              .createQueryBuilder()
              .relation(Promotion, "items")
              .of(promo.id)
              .loadMany<MenuItem>()
          : []
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date())
        if (
          !promo ||
          !promo.isActive ||
          dateOnlyInManila(promo.startDate) > today ||
          dateOnlyInManila(promo.endDate) < today ||
          (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit)
        )
          throw new Error("That promotion is expired or unavailable.")
        if (promo.minSpend !== null && subtotal < Number(promo.minSpend))
          throw new Error(
            `This promotion requires a minimum spend of ₱${Number(promo.minSpend).toFixed(2)}.`
          )
        const eligibleSubtotal = promoItems.length
          ? itemRows
              .filter((line) =>
                promoItems.some((item) => item.id === line.menuItemId)
              )
              .reduce((sum, line) => sum + line.subtotal, 0)
          : subtotal
        if (!eligibleSubtotal)
          throw new Error(
            "The selected promotion does not apply to these menu items."
          )
        const promoValue = Number(promo.discountValue ?? 0)
        const promoBase = Math.max(0, eligibleSubtotal - discountAmount)
        promoDiscountAmount = Math.min(
          promoBase,
          Math.round(
            (promo.promoType === "percentage"
              ? (promoBase * promoValue) / 100
              : promo.promoType === "fixed_amount"
                ? promoValue
                : 0) * 100
          ) / 100
        )
      }
      discountAmount = Math.min(subtotal, discountAmount + promoDiscountAmount)
      const taxableSubtotal = Math.max(0, subtotal - discountAmount)
      const vatRate = Number(settings?.vatRate ?? 0)
      const tax = settings?.vatEnabled
        ? Math.round(
            (settings.vatInclusive
              ? (taxableSubtotal * vatRate) / (100 + vatRate)
              : (taxableSubtotal * vatRate) / 100) * 100
          ) / 100
        : 0
      const serviceCharge = settings?.serviceChargeEnabled
        ? Math.round(
            ((taxableSubtotal * Number(settings.serviceChargeRate)) / 100) * 100
          ) / 100
        : 0
      const total =
        Math.round(
          (taxableSubtotal +
            serviceCharge +
            (settings?.vatEnabled && settings.vatInclusive ? 0 : tax)) *
            100
        ) / 100
      const number =
        `${(settings?.orderNumberPrefix ?? "ORD-").slice(0, 10)}${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 4).toUpperCase()}`.slice(
          0,
          30
        )
      const orderRepo = manager.getRepository(Order)
      const cashPayment = parsed.data.paymentMethod === "cash"
      const order = await orderRepo.save(
        orderRepo.create({
          id: randomUUID(),
          orderNumber: number,
          tableId: parsed.data.tableId,
          customerId,
          orderType: parsed.data.orderType,
          status: cashPayment ? "preparing" : "pending",
          subtotal,
          discount: discountAmount,
          tax,
          total,
          createdByStaffId: null,
          updatedAt: null,
          paymentStatus: cashPayment ? "paid" : "pending",
          paymentMethod: parsed.data.paymentMethod,
          paymentReference: null,
          customerPaymentReference: null,
          paymentReferenceToken: cashPayment ? null : randomUUID(),
          guestIpHash: null,
          adminHiddenAt: null,
        })
      )
      const savedItems = await manager
        .getRepository(OrderItem)
        .save(
          itemRows.map((line) =>
            manager
              .getRepository(OrderItem)
              .create({ ...line, orderId: order.id })
          )
        )
      if (cashPayment) {
        await consumeOrderStock(order, savedItems, manager)
        await manager.getRepository(Payment).save(
          manager.getRepository(Payment).create({
            id: randomUUID(),
            orderId: order.id,
            receiptNumber: `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
            amountPaid: Number(order.total),
            paymentMethod: "cash",
            referenceNumber: null,
            processedByStaffId: null,
          })
        )
      }
      if (order.tableId) {
        const tableRepository = manager.getRepository(RestaurantTable)
        const table = await tableRepository.findOneBy({ id: order.tableId })
        if (table) {
          table.status = "occupied"
          table.occupiedAt = new Date()
          await tableRepository.save(table)
        }
      }
      if (discountType && discountAmount - promoDiscountAmount > 0) {
        await manager.getRepository(OrderDiscount).save(
          manager.getRepository(OrderDiscount).create({
            id: randomUUID(),
            orderId: order.id,
            discountTypeId: discountType.id,
            idNumber: parsed.data.discountIdNumber || null,
            holderName: parsed.data.discountHolderName!,
            discountAmount:
              Math.round((discountAmount - promoDiscountAmount) * 100) / 100,
            appliedByStaffId: null,
          })
        )
      }
      if (promo && promoDiscountAmount > 0) {
        await manager.getRepository(OrderPromotion).save(
          manager.getRepository(OrderPromotion).create({
            id: randomUUID(),
            orderId: order.id,
            promotionId: promo.id,
            discountAmount: promoDiscountAmount,
          })
        )
        promo.usageCount += 1
        await manager.getRepository(Promotion).save(promo)
      }
      await manager.getRepository(OrderStatusHistory).save(
        manager.getRepository(OrderStatusHistory).create({
          id: randomUUID(),
          orderId: order.id,
          status: order.status,
          changedByStaffId: null,
        })
      )
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        started: cashPayment,
        paymentReferenceToken: order.paymentReferenceToken,
      }
    })
    await publishAdminOrderChange(createdOrder.id)
    revalidateOrders()
    return {
      ok: true,
      paymentReferenceToken: createdOrder.paymentReferenceToken,
      message: createdOrder.started
        ? `Cash payment received. Order ${createdOrder.orderNumber} started and stock was deducted.`
        : `Order ${createdOrder.orderNumber} created and is awaiting payment.`,
    }
  } catch (error) {
    console.error("Unable to create admin order:", error)
    const message = error instanceof Error ? error.message : ""
    const known =
      [
        "One or more menu items are unavailable. Refresh and try again.",
        "Select a table for this QR order.",
        "That table is no longer available. Choose another table.",
        "Selected customer no longer exists. Refresh and try again.",
        "That discount type is no longer available.",
        "Discounts are disabled in System Settings.",
        "Enter the discount holder name.",
        "Enter the required discount ID number.",
        "That promotion is expired or unavailable.",
        "The selected promotion does not apply to these menu items.",
      ].includes(message) ||
      message.startsWith("The total quantity") ||
      message.startsWith("This promotion requires")
    return {
      ok: false,
      message: known
        ? message
        : "Could not create the order. Check the database connection and try again.",
    }
  }
}

async function consumeOrderStock(
  order: Order,
  orderItems: OrderItem[],
  manager: EntityManager
) {
  const stockLogs = manager.getRepository(InventoryStockLog)
  const inventoryRepository = manager.getRepository(InventoryItem)
  const menuRepository = manager.getRepository(MenuItem)
  const recipeRepository = manager.getRepository(MenuItemIngredient)

  for (const orderLine of orderItems) {
    const menu = await menuRepository
      .createQueryBuilder("menu")
      .setLock("pessimistic_write")
      .where("menu.id = :id", { id: orderLine.menuItemId })
      .getOne()
    if (!menu)
      throw new Error(`Menu item for ${orderLine.menuItemId} is missing.`)

    if (menu.stockQuantity !== null) {
      if (menu.stockQuantity < orderLine.quantity)
        throw new Error(`Not enough ${menu.name} in menu stock.`)
      menu.stockQuantity -= orderLine.quantity
      menu.updatedAt = new Date()
      await menuRepository.save(menu)
      await stockLogs.save(
        stockLogs.create({
          id: randomUUID(),
          itemType: "menu_item",
          inventoryItemId: null,
          menuItemId: menu.id,
          type: "consumed",
          quantityChange: -orderLine.quantity,
          quantityAfter: menu.stockQuantity,
          note: `order-inventory:${order.id}:menu:${orderLine.id}`,
          performedByStaffId: null,
        })
      )
    }

    const recipe = await recipeRepository.find({
      where: { menuItemId: menu.id },
      order: { inventoryItemId: "ASC" },
    })
    for (const recipeLine of recipe) {
      const ingredient = await inventoryRepository
        .createQueryBuilder("ingredient")
        .setLock("pessimistic_write")
        .where("ingredient.id = :id", { id: recipeLine.inventoryItemId })
        .getOne()
      if (!ingredient || !ingredient.isActive)
        throw new Error(
          `A recipe ingredient for ${menu.name} is inactive or missing.`
        )
      const consumed = Number(recipeLine.quantityUsed) * orderLine.quantity
      const quantityAfter = Number(ingredient.stockQuantity) - consumed
      if (quantityAfter < 0)
        throw new Error(`Not enough ${ingredient.name} for ${menu.name}.`)
      ingredient.stockQuantity = quantityAfter
      ingredient.updatedAt = new Date()
      await inventoryRepository.save(ingredient)
      await stockLogs.save(
        stockLogs.create({
          id: randomUUID(),
          itemType: "ingredient",
          inventoryItemId: ingredient.id,
          menuItemId: null,
          type: "consumed",
          quantityChange: -consumed,
          quantityAfter,
          note: `order-inventory:${order.id}:line:${orderLine.id}:ingredient:${ingredient.id}`,
          performedByStaffId: null,
        })
      )
    }
  }
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<OrderActionResult> {
  const parsedId = orderIdSchema.safeParse(orderId)
  const parsedStatus = orderStatusSchema.safeParse(nextStatus)
  if (!parsedId.success || !parsedStatus.success)
    return { ok: false, message: "Invalid order or status." }

  try {
    const dataSource = await getInitializedDataSource()
    const resultMessage = await dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder("order")
        .setLock("pessimistic_write")
        .where("order.id = :id", { id: parsedId.data })
        .getOne()
      if (!order || order.adminHiddenAt)
        throw new Error("Order not found. Refresh the list.")
      if (
        ["preparing", "completed"].includes(parsedStatus.data) &&
        order.paymentStatus !== "paid" &&
        order.orderType !== "delivery"
      )
        throw new Error(
          "Payment must be confirmed before this order can be started or completed."
        )
      if (!transitions[order.status].includes(parsedStatus.data))
        throw new Error(
          `Cannot move an order from ${order.status} to ${parsedStatus.data}.`
        )

      if (order.status === "pending" && parsedStatus.data === "preparing") {
        const items = await manager
          .getRepository(OrderItem)
          .find({ where: { orderId: order.id }, order: { id: "ASC" } })
        if (!items.length)
          throw new Error("This order has no items and cannot be accepted.")
        await consumeOrderStock(order, items, manager)
      }
      if (parsedStatus.data === "cancelled")
        await restoreOrderStock(order, manager)

      const previousStatus = order.status
      order.status = parsedStatus.data
      order.updatedAt = new Date()
      await manager.getRepository(Order).save(order)
      if (order.orderType === "delivery") {
        const delivery = await manager
          .getRepository(Delivery)
          .findOneBy({ orderId: order.id })
        if (delivery) {
          const now = new Date()
          if (parsedStatus.data === "served") {
            delivery.status = "picked_up"
            delivery.pickedUpAt ??= now
          } else if (parsedStatus.data === "completed") {
            delivery.status = "delivered"
            delivery.deliveredAt ??= now
          } else if (parsedStatus.data === "cancelled") {
            delivery.status = "cancelled"
          }
          delivery.updatedAt = now
          await manager.getRepository(Delivery).save(delivery)
        }
      }
      await manager.getRepository(OrderStatusHistory).save(
        manager.getRepository(OrderStatusHistory).create({
          id: randomUUID(),
          orderId: order.id,
          status: order.status,
          changedByStaffId: null,
        })
      )

      let earnedPoints = 0
      if (parsedStatus.data === "completed" && order.paymentStatus === "paid")
        earnedPoints = await awardOrderLoyaltyPoints(order, manager)

      if (order.tableId) {
        const tableRepository = manager.getRepository(RestaurantTable)
        const table = await tableRepository.findOneBy({ id: order.tableId })
        if (table && parsedStatus.data === "preparing") {
          table.status = "occupied"
          table.occupiedAt ??= new Date()
          await tableRepository.save(table)
        } else if (
          table &&
          ["completed", "cancelled"].includes(parsedStatus.data)
        ) {
          const activeOrder = await manager
            .getRepository(Order)
            .createQueryBuilder("other")
            .where("other.tableId = :tableId", { tableId: table.id })
            .andWhere("other.id != :orderId", { orderId: order.id })
            .andWhere("other.status IN (:...statuses)", {
              statuses: ["pending", "preparing", "ready", "served"],
            })
            .getOne()
          if (!activeOrder) {
            table.status = "available"
            table.occupiedAt = null
            await tableRepository.save(table)
          }
        }
      }

      return {
        orderId: order.id,
        message: `Order ${order.orderNumber}: ${previousStatus} → ${order.status}.${earnedPoints ? ` Customer earned ${earnedPoints} loyalty points.` : ""}`,
      }
    })
    await publishAdminOrderChange(resultMessage.orderId)
    revalidateOrders()
    return { ok: true, message: resultMessage.message }
  } catch (error) {
    console.error("Unable to update order status:", error)
    const known =
      error instanceof Error &&
      (error.message === "Order not found. Refresh the list." ||
        error.message ===
          "Selected customer no longer exists. Refresh and try again." ||
        error.message === "This order has no items and cannot be accepted." ||
        error.message ===
          "Payment must be confirmed before this order can be started or completed." ||
        error.message.startsWith("Cannot move an order") ||
        error.message.startsWith("Not enough ") ||
        error.message.startsWith("A recipe ingredient") ||
        error.message.startsWith("Menu item for "))
    return {
      ok: false,
      message:
        known && error instanceof Error
          ? error.message
          : "Could not update the order. Check the database connection and try again.",
    }
  }
}

export async function markOrderPaymentReceived(
  orderId: string,
  submittedReferenceNumber: string
): Promise<OrderActionResult> {
  const parsedId = orderIdSchema.safeParse(orderId)
  if (!parsedId.success) return { ok: false, message: "Invalid order." }

  try {
    const dataSource = await getInitializedDataSource()
    const paymentResult = await dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder("order")
        .setLock("pessimistic_write")
        .where("order.id = :id", { id: parsedId.data })
        .getOne()
      if (!order || order.adminHiddenAt)
        throw new Error("Order not found. Refresh the list.")
      if (order.paymentStatus !== "pending")
        throw new Error("This order is no longer awaiting payment.")
      if (order.status === "cancelled")
        throw new Error("Cancelled orders cannot be marked paid.")
      if (order.orderType === "delivery")
        throw new Error("Cash-on-delivery orders stay unpaid in the admin and cashier screens.")
      if (!order.paymentMethod)
        throw new Error("This order has no payment method recorded.")
      const referenceNumber = submittedReferenceNumber.trim()
      const referenceRequired = ["gcash", "maya", "qrph"].includes(
        order.paymentMethod
      )
      if (referenceRequired && !referenceNumber)
        throw new Error("Enter the payment reference number.")
      if (referenceRequired && !order.customerPaymentReference)
        throw new Error("Waiting for the customer's payment reference.")
      if (referenceNumber.length > 100)
        throw new Error(
          "Payment reference numbers must be 100 characters or fewer."
        )
      const normalized = (value: string) =>
        value.trim().replace(/\s+/g, "").toUpperCase()
      if (
        referenceRequired &&
        normalized(referenceNumber) !==
          normalized(order.customerPaymentReference ?? "")
      )
        throw new Error(
          "The verified reference does not match the customer's reference."
        )
      if (referenceNumber) {
        const duplicateReference = await manager
          .getRepository(Payment)
          .findOneBy({
            paymentMethod: order.paymentMethod as PaymentMethod,
            referenceNumber,
          })
        if (duplicateReference)
          throw new Error("This payment reference has already been used.")
      }

      order.paymentStatus = "paid"
      order.paymentReference = referenceNumber || null
      order.updatedAt = new Date()
      await manager.getRepository(Order).save(order)
      const payment = await manager.getRepository(Payment).save(
        manager.getRepository(Payment).create({
          id: randomUUID(),
          orderId: order.id,
          receiptNumber: `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          amountPaid: Number(order.total),
          paymentMethod: order.paymentMethod as PaymentMethod,
          referenceNumber: referenceNumber || null,
          processedByStaffId: null,
        })
      )
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        receiptNumber: payment.receiptNumber,
        paidAt: payment.paidAt.toISOString(),
      }
    })

    await publishAdminOrderChange(paymentResult.orderId)
    revalidateOrders()
    return {
      ok: true,
      message: `Payment for ${paymentResult.orderNumber} marked received.`,
      receiptNumber: paymentResult.receiptNumber,
      paidAt: paymentResult.paidAt,
    }
  } catch (error) {
    console.error("Unable to confirm order payment:", error)
    const message =
      error instanceof Error &&
      (error.message === "Order not found. Refresh the list." ||
        error.message === "This order is no longer awaiting payment." ||
        error.message === "Cancelled orders cannot be marked paid." ||
        error.message === "This order has no payment method recorded." ||
        error.message === "Enter the payment reference number." ||
        error.message === "Waiting for the customer's payment reference." ||
        error.message ===
          "The verified reference does not match the customer's reference." ||
        error.message === "This payment reference has already been used." ||
        error.message.startsWith("Payment reference numbers must be"))
        ? error.message
        : "Could not confirm payment. Check the database connection and try again."
    return { ok: false, message }
  }
}
