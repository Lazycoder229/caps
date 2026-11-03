"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { In, Not } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { Delivery } from "@/lib/database/entities/entities/Delivery"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { Order } from "@/lib/database/entities/entities/Order"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { OrderDiscount } from "@/lib/database/entities/entities/OrderDiscount"
import { OrderItem } from "@/lib/database/entities/entities/OrderItem"
import { OrderPromotion } from "@/lib/database/entities/entities/OrderPromotion"
import { OrderStatusHistory } from "@/lib/database/entities/entities/OrderStatusHistory"
import { OrderVoid } from "@/lib/database/entities/entities/OrderVoid"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { dateOnlyInManila } from "@/lib/dates/date-only"
import { publishAdminOrderChange } from "@/lib/realtime/order-events"
import {
  getCustomerSession,
  requireCustomerSession,
} from "@/lib/customer-auth/session"

const idSchema = z.string().uuid()
const orderSchema = z.object({
  orderType: z.enum(["counter", "qr", "delivery"]),
  tableId: z.string().uuid().nullable(),
  guestName: z.string().trim().max(100).nullable(),
  guestContactNumber: z.string().trim().max(20).nullable(),
  deliveryRecipientName: z.string().trim().max(100).nullable().optional(),
  deliveryContactNumber: z.string().trim().max(20).nullable().optional(),
  deliveryAddress: z.string().trim().max(2000).nullable().optional(),
  deliveryLatitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  deliveryLongitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  deliveryInstructions: z.string().trim().max(1000).nullable().optional(),
  paymentMethod: z.enum(["cash", "gcash", "maya", "qrph"]),
  promotionId: z.string().uuid().nullable(),
  discountTypeId: z.string().uuid().nullable(),
  discountHolderName: z.string().trim().max(100).nullable(),
  discountIdNumber: z.string().trim().max(50).nullable(),
  lines: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().trim().max(255).nullable(),
      })
    )
    .min(1)
    .max(50),
})

function refreshCustomerPages() {
  revalidatePath("/customer/dashboard")
  revalidatePath("/customer/kiosk")
  revalidatePath("/customer/orders")
  revalidatePath("/customer/rewards")
  revalidatePath("/admin/orders")
  revalidatePath("/admin/voids")
  revalidatePath("/admin/loyalty")
  revalidatePath("/admin/inventory")
  revalidatePath("/admin/tables")
}

export async function updateCustomerProfile(formData: FormData) {
  const customer = await requireCustomerSession()
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name.").max(100),
      contactNumber: z.string().trim().max(20),
    })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      contactNumber: String(formData.get("contactNumber") ?? ""),
    })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check your details.",
    }
  const repository = (await getInitializedDataSource()).getRepository(Customer)
  await repository.update(customer.id, {
    name: parsed.data.name,
    contactNumber: parsed.data.contactNumber || null,
    updatedAt: new Date(),
  })
  revalidatePath("/customer")
  revalidatePath("/customer/account")
  return { ok: true, message: "Your profile has been updated." }
}

export async function createCustomerOrder(formData: FormData) {
  const sessionCustomer = await getCustomerSession()
  return createCustomerOrderWithCustomer(formData, sessionCustomer)
}

export async function createCustomerOrderForApi(
  input: {
    orderType: "counter" | "qr" | "delivery"
    tableId?: string | null
    guestName?: string | null
    guestContactNumber?: string | null
    deliveryRecipientName?: string | null
    deliveryContactNumber?: string | null
    deliveryAddress?: string | null
    deliveryLatitude?: number | null
    deliveryLongitude?: number | null
    deliveryInstructions?: string | null
    paymentMethod: "cash" | "gcash" | "maya" | "qrph"
    promotionId?: string | null
    discountTypeId?: string | null
    discountHolderName?: string | null
    discountIdNumber?: string | null
    lines: { menuItemId: string; quantity: number; notes?: string | null }[]
  },
  customer: Customer | null
) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(input)) {
    if (value == null) formData.set(key, "")
    else formData.set(key, key === "lines" ? JSON.stringify(value) : String(value))
  }
  return createCustomerOrderWithCustomer(formData, customer)
}

async function createCustomerOrderWithCustomer(
  formData: FormData,
  sessionCustomer: Customer | null
) {
  const customer =
    sessionCustomer && !sessionCustomer.isGuest ? sessionCustomer : null
  let lines: unknown
  try {
    lines = JSON.parse(String(formData.get("lines") ?? ""))
  } catch {
    return { ok: false, message: "Add at least one valid menu item." }
  }
  const parsed = orderSchema.safeParse({
    orderType: String(formData.get("orderType") ?? "counter"),
    tableId: formData.get("tableId") ? String(formData.get("tableId")) : null,
    guestName: String(formData.get("guestName") ?? "").trim() || null,
    guestContactNumber:
      String(formData.get("guestContactNumber") ?? "").trim() || null,
    deliveryRecipientName: String(formData.get("deliveryRecipientName") ?? "").trim() || null,
    deliveryContactNumber: String(formData.get("deliveryContactNumber") ?? "").trim() || null,
    deliveryAddress: String(formData.get("deliveryAddress") ?? "").trim() || null,
    deliveryLatitude: formData.get("deliveryLatitude") ? Number(formData.get("deliveryLatitude")) : null,
    deliveryLongitude: formData.get("deliveryLongitude") ? Number(formData.get("deliveryLongitude")) : null,
    deliveryInstructions: String(formData.get("deliveryInstructions") ?? "").trim() || null,
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    promotionId: formData.get("promotionId")
      ? String(formData.get("promotionId"))
      : null,
    discountTypeId: formData.get("discountTypeId")
      ? String(formData.get("discountTypeId"))
      : null,
    discountHolderName:
      String(formData.get("discountHolderName") ?? "").trim() || null,
    discountIdNumber:
      String(formData.get("discountIdNumber") ?? "").trim() || null,
    lines,
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check your order.",
    }
  // Delivery orders are always cash on delivery. Enforce this on the server so
  // a modified client cannot create a delivery order with a prepaid method.
  const paymentMethod =
    parsed.data.orderType === "delivery" ? "cash" : parsed.data.paymentMethod
  if (
    !customer &&
    !(
      (parsed.data.guestName ??
        (parsed.data.orderType === "delivery"
          ? parsed.data.deliveryRecipientName
          : null)) &&
      (parsed.data.guestName ?? parsed.data.deliveryRecipientName ?? "").length >= 2
    )
  )
    return { ok: false, message: "Enter your name to place a guest order." }

  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      let customerId: string
      if (customer) {
        const customerRecord = await manager
          .getRepository(Customer)
          .findOneBy({ id: customer.id })
        if (!customerRecord || customerRecord.isGuest)
          throw new Error(
            "Your customer account is unavailable. Sign in again."
          )
        customerId = customerRecord.id
      } else {
        const guestRepository = manager.getRepository(Customer)
        const guest = await guestRepository.save(
          guestRepository.create({
            id: randomUUID(),
            email: null,
            password: null,
            name: parsed.data.guestName ?? parsed.data.deliveryRecipientName!,
            contactNumber: parsed.data.guestContactNumber ?? parsed.data.deliveryContactNumber ?? null,
            loyaltyPointsBalance: 0,
            isGuest: true,
            dateOfBirth: null,
            pwdIdNumber: null,
            updatedAt: null,
          })
        )
        customerId = guest.id
      }
      const settings = await manager
        .getRepository(SystemSetting)
        .findOne({ where: {} })
      if (parsed.data.orderType === "delivery") {
        if (!settings?.deliveryEnabled)
          throw new Error("Delivery is not available right now. Choose pickup instead.")
        if (!parsed.data.deliveryRecipientName || parsed.data.deliveryRecipientName.length < 2)
          throw new Error("Enter the recipient's name for delivery.")
        if (!parsed.data.deliveryContactNumber || parsed.data.deliveryContactNumber.length < 7)
          throw new Error("Enter a valid contact number for delivery.")
        if (!parsed.data.deliveryAddress || parsed.data.deliveryAddress.length < 8)
          throw new Error("Enter your complete delivery address and select the map pin.")
        if (parsed.data.deliveryLatitude == null || parsed.data.deliveryLongitude == null)
          throw new Error("Select your delivery location on the map.")
      }
      const methodEnabled: Record<typeof parsed.data.paymentMethod, boolean> = {
        cash: settings?.paymentCashEnabled !== false,
        gcash: settings?.paymentGcashEnabled !== false,
        maya: settings?.paymentMayaEnabled !== false,
        qrph: settings?.paymentQrphEnabled !== false,
      }
      if (parsed.data.orderType !== "delivery" && !methodEnabled[paymentMethod])
        throw new Error(
          "That payment method is not available. Refresh and choose another."
        )
      if (paymentMethod !== "cash") {
        const imageColumns = {
          gcash: "gcashQrImage",
          maya: "mayaQrImage",
          qrph: "qrphQrImage",
        } as const
        const imageColumn =
          imageColumns[paymentMethod as keyof typeof imageColumns]
        const paymentSettings = await manager
          .getRepository(SystemSetting)
          .createQueryBuilder("settings")
          .addSelect(`settings.${imageColumn}`)
          .getOne()
        if (!paymentSettings?.[imageColumn])
          throw new Error(
            "The selected payment QR is not configured. Choose cash or contact the restaurant."
          )
      }
      if (
        parsed.data.orderType === "qr" &&
        settings?.requireTableSelection &&
        !parsed.data.tableId
      )
        throw new Error("Select a table for dine-in.")
      let table: RestaurantTable | null = null
      if (parsed.data.tableId) {
        table = await manager
          .getRepository(RestaurantTable)
          .createQueryBuilder("table")
          .setLock("pessimistic_write")
          .where("table.id = :id", { id: parsed.data.tableId })
          .getOne()
        const tableCanAcceptDineInOrder =
          table?.status === "available" ||
          (parsed.data.orderType === "qr" && table?.status === "occupied")
        if (!table || !tableCanAcceptDineInOrder)
          throw new Error(
            "That table is no longer available. Choose another table."
          )
        if (parsed.data.orderType !== "qr")
          throw new Error("Choose dine-in to reserve a table.")
      }

      const menuIds = [
        ...new Set(parsed.data.lines.map((line) => line.menuItemId)),
      ]
      const menus = await manager
        .getRepository(MenuItem)
        .createQueryBuilder("menu")
        .setLock("pessimistic_write")
        .where("menu.id IN (:...ids)", { ids: menuIds })
        .andWhere("menu.isAvailable = :available", { available: true })
        .getMany()
      if (menus.length !== menuIds.length)
        throw new Error(
          "One or more menu items are unavailable. Refresh the menu."
        )
      const menuById = new Map(menus.map((menu) => [menu.id, menu]))
      const grouped = new Map<string, { quantity: number; notes: string[] }>()
      for (const line of parsed.data.lines) {
        const value = grouped.get(line.menuItemId) ?? { quantity: 0, notes: [] }
        value.quantity += line.quantity
        if (value.quantity > 999)
          throw new Error("An item quantity cannot exceed 999.")
        if (line.notes) value.notes.push(line.notes)
        grouped.set(line.menuItemId, value)
      }
      const itemRows = [...grouped].map(([menuItemId, row]) => {
        const item = menuById.get(menuItemId)!
        const unitPrice = Number(item.price)
        return {
          id: randomUUID(),
          menuItemId,
          quantity: row.quantity,
          unitPrice,
          subtotal: Math.round(unitPrice * row.quantity * 100) / 100,
          notes: row.notes.join(" · ").slice(0, 255) || null,
        }
      })
      const subtotal =
        Math.round(
          itemRows.reduce((sum, item) => sum + item.subtotal, 0) * 100
        ) / 100
      if (parsed.data.orderType === "delivery" && subtotal < Number(settings?.deliveryMinimumOrder ?? 0))
        throw new Error(`Delivery requires a minimum order of ₱${Number(settings?.deliveryMinimumOrder ?? 0).toFixed(2)}.`)
      const deliveryFee = parsed.data.orderType === "delivery" ? Number(settings?.deliveryFee ?? 49) : 0
      let discountType: DiscountType | null = null
      let discountAmount = 0
      if (parsed.data.discountTypeId) {
        if (settings?.seniorPwdDiscountEnabled === false)
          throw new Error("Discounts are currently unavailable.")
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
        discountAmount = Math.min(
          subtotal,
          Math.round(
            ((subtotal * Number(discountType.percentage)) / 100) * 100
          ) / 100
        )
      }
      let promotion: Promotion | null = null
      let promotionDiscount = 0
      if (parsed.data.promotionId) {
        const promoRepository = manager.getRepository(Promotion)
        promotion = await promoRepository
          .createQueryBuilder("promo")
          .setLock("pessimistic_write")
          .where("promo.id = :id", { id: parsed.data.promotionId })
          .getOne()
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date())
        if (
          !promotion ||
          !promotion.isActive ||
          promotion.promoType === "buy_x_get_y" ||
          dateOnlyInManila(promotion.startDate) > today ||
          dateOnlyInManila(promotion.endDate) < today ||
          (promotion.usageLimit !== null &&
            promotion.usageCount >= promotion.usageLimit)
        )
          throw new Error("That promotion is no longer available.")
        if (
          promotion.minSpend !== null &&
          subtotal < Number(promotion.minSpend)
        )
          throw new Error(
            `This promotion requires a minimum spend of ₱${Number(promotion.minSpend).toFixed(2)}.`
          )
        const promoItems = await promoRepository
          .createQueryBuilder()
          .relation(Promotion, "items")
          .of(promotion.id)
          .loadMany<MenuItem>()
        const eligibleSubtotal = promoItems.length
          ? itemRows
              .filter((line) =>
                promoItems.some((menu) => menu.id === line.menuItemId)
              )
              .reduce((sum, line) => sum + line.subtotal, 0)
          : subtotal
        if (!eligibleSubtotal)
          throw new Error(
            "The selected promotion does not apply to these items."
          )
        const promotionBase = Math.max(0, eligibleSubtotal - discountAmount)
        const value = Number(promotion.discountValue ?? 0)
        promotionDiscount = Math.min(
          promotionBase,
          Math.round(
            (promotion.promoType === "percentage"
              ? (promotionBase * value) / 100
              : value) * 100
          ) / 100
        )
      }
      const discount = Math.min(subtotal, discountAmount + promotionDiscount)
      const taxableSubtotal = Math.max(0, subtotal - discount)
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
            deliveryFee +
            serviceCharge +
            (settings?.vatEnabled && settings.vatInclusive ? 0 : tax)) *
            100
        ) / 100
      const orderNumber =
        `${(settings?.orderNumberPrefix ?? "ORD-").slice(0, 10)}${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 4).toUpperCase()}`.slice(
          0,
          30
        )
      const paymentReferenceToken =
        parsed.data.orderType === "delivery" ? null : randomUUID()
      const order = await manager.getRepository(Order).save(
        manager.getRepository(Order).create({
          id: randomUUID(),
          orderNumber,
          tableId: table?.id ?? null,
          customerId,
          orderType: parsed.data.orderType,
          status: "pending",
          subtotal,
          discount,
          tax,
          total,
          deliveryFee,
          createdByStaffId: null,
          updatedAt: null,
          paymentStatus: "pending",
          paymentMethod,
          paymentReference: null,
          customerPaymentReference: null,
          paymentReferenceToken,
          guestIpHash: null,
          adminHiddenAt: null,
        })
      )
      if (parsed.data.orderType === "delivery") {
        await manager.getRepository(Delivery).save(manager.getRepository(Delivery).create({
          id: randomUUID(),
          orderId: order.id,
          recipientName: parsed.data.deliveryRecipientName!,
          recipientPhone: parsed.data.deliveryContactNumber!,
          address: parsed.data.deliveryAddress!,
          latitude: parsed.data.deliveryLatitude!,
          longitude: parsed.data.deliveryLongitude!,
          deliveryFee,
          instructions: parsed.data.deliveryInstructions || null,
          status: "pending",
          assignedRiderId: null,
          pickedUpAt: null,
          deliveredAt: null,
          updatedAt: null,
        }))
      }
      await manager
        .getRepository(OrderItem)
        .save(
          itemRows.map((line) =>
            manager
              .getRepository(OrderItem)
              .create({ ...line, orderId: order.id })
          )
        )
      if (discountType && discountAmount > 0) {
        await manager.getRepository(OrderDiscount).save(
          manager.getRepository(OrderDiscount).create({
            id: randomUUID(),
            orderId: order.id,
            discountTypeId: discountType.id,
            idNumber: parsed.data.discountIdNumber || null,
            holderName: parsed.data.discountHolderName!,
            discountAmount,
            appliedByStaffId: null,
          })
        )
      }
      if (promotion && promotionDiscount > 0) {
        await manager.getRepository(OrderPromotion).save(
          manager.getRepository(OrderPromotion).create({
            id: randomUUID(),
            orderId: order.id,
            promotionId: promotion.id,
            discountAmount: promotionDiscount,
          })
        )
        promotion.usageCount += 1
        await manager.getRepository(Promotion).save(promotion)
      }
      if (table?.status === "available") {
        table.status = "occupied"
        table.occupiedAt = new Date()
        await manager.getRepository(RestaurantTable).save(table)
      }
      await manager.getRepository(OrderStatusHistory).save(
        manager.getRepository(OrderStatusHistory).create({
          id: randomUUID(),
          orderId: order.id,
          status: "pending",
          changedByStaffId: null,
        })
      )
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentReferenceToken,
        guestOrder: !customer,
        receipt: {
          receiptNumber: order.orderNumber,
          date: order.createdAt.toISOString(),
          items: itemRows.map((line) => ({
            name: menuById.get(line.menuItemId)?.name ?? "Menu item",
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
          paymentMethod,
          cashier: "PRIME",
          totals: {
            subtotal,
            discount,
            tax,
            serviceCharge,
            total,
          },
        },
      }
    })
    await publishAdminOrderChange(result.id)
    refreshCustomerPages()
    return {
      ok: true,
      message: `Order ${result.orderNumber} placed. Payment must be verified before the kitchen starts it.`,
      ...result,
    }
  } catch (error) {
    console.error("Unable to create customer order:", error)
    const message = error instanceof Error ? error.message : ""
    const known =
      message === "Your customer account is unavailable. Sign in again." ||
      message ===
        "That payment method is not available. Refresh and choose another." ||
      message ===
        "The selected payment QR is not configured. Choose cash or contact the restaurant." ||
      message === "Select a table for dine-in." ||
      message === "That table is no longer available. Choose another table." ||
      message === "Choose dine-in to reserve a table." ||
      message === "One or more menu items are unavailable. Refresh the menu." ||
      message === "That promotion is no longer available." ||
      message === "The selected promotion does not apply to these items." ||
      message.startsWith("An item quantity") ||
      message.startsWith("This promotion requires")
    return {
      ok: false,
      message: known ? message : "Could not place the order. Please try again.",
    }
  }
}

export async function submitCustomerCancellationRequest(
  orderId: string,
  reasonText: string
) {
  const customer = await requireCustomerSession()
  const parsed = z
    .object({
      orderId: idSchema,
      reason: z
        .string()
        .trim()
        .min(3, "Enter a reason for the request.")
        .max(1000),
    })
    .safeParse({ orderId, reason: reasonText })
  if (!parsed.success)
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Check the cancellation request.",
    }
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const orders = manager.getRepository(Order)
      const order = await orders
        .createQueryBuilder("order")
        .setLock("pessimistic_write")
        .where("order.id = :orderId", { orderId: parsed.data.orderId })
        .andWhere("order.customerId = :customerId", { customerId: customer.id })
        .getOne()
      if (!order) throw new Error("Order not found.")
      if (order.status !== "pending")
        throw new Error(
          "Cancellation requests are available only before the order starts preparing."
        )
      const existing = await manager
        .getRepository(OrderVoid)
        .findOneBy({ orderId: order.id, status: "pending" })
      if (existing)
        throw new Error("A cancellation request is already under review.")
      const settings = await manager
        .getRepository(SystemSetting)
        .findOne({ where: {} })
      // A paid order needs a staff review because the system does not issue refunds automatically.
      const autoApprove =
        !(settings?.managerApprovalForVoids ?? true) &&
        order.paymentStatus !== "paid"
      await manager.getRepository(OrderVoid).save(
        manager.getRepository(OrderVoid).create({
          id: randomUUID(),
          orderId: order.id,
          requestedByStaffId: null,
          approvedByStaffId: null,
          reason: parsed.data.reason,
          status: autoApprove ? "approved" : "pending",
          resolvedAt: autoApprove ? new Date() : null,
          resolutionNotes: autoApprove
            ? "Automatically approved because manager approval for voids is disabled."
            : null,
        })
      )
      if (autoApprove) {
        order.status = "cancelled"
        order.updatedAt = new Date()
        await orders.save(order)
        await manager.getRepository(OrderStatusHistory).save(
          manager.getRepository(OrderStatusHistory).create({
            id: randomUUID(),
            orderId: order.id,
            status: "cancelled",
            changedByStaffId: null,
          })
        )
        if (order.tableId) {
          const otherActive = await orders.count({
            where: {
              tableId: order.tableId,
              id: Not(order.id),
              status: In(["pending", "preparing", "ready"]),
            },
          })
          const table =
            otherActive === 0
              ? await manager
                  .getRepository(RestaurantTable)
                  .findOneBy({ id: order.tableId })
              : null
          if (table) {
            table.status = "available"
            table.occupiedAt = null
            await manager.getRepository(RestaurantTable).save(table)
          }
        }
      }
      return autoApprove
        ? "Your order has been cancelled."
        : "Your cancellation request was sent to the restaurant for review."
    })
    refreshCustomerPages()
    return { ok: true, message: result }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Order not found.",
      "Cancellation requests are available only before the order starts preparing.",
      "A cancellation request is already under review.",
    ].includes(message)
    return {
      ok: false,
      message: known
        ? message
        : "Could not send the cancellation request. Please try again.",
    }
  }
}

export async function removeCustomerOrderFromHistory(orderId: string) {
  const customer = await requireCustomerSession()
  if (!idSchema.safeParse(orderId).success)
    return { ok: false, message: "Select a valid order." }

  try {
    const source = await getInitializedDataSource()
    const result = await source
      .getRepository(Order)
      .createQueryBuilder()
      .update(Order)
      .set({ customerHiddenAt: new Date() })
      .where("id = :orderId", { orderId })
      .andWhere("customer_id = :customerId", { customerId: customer.id })
      .andWhere("status IN (:...statuses)", {
        statuses: ["completed", "cancelled"],
      })
      .andWhere("customer_hidden_at IS NULL")
      .execute()

    if (!result.affected)
      return {
        ok: false,
        message: "Only completed or cancelled orders can be removed.",
      }

    refreshCustomerPages()
    return { ok: true, message: "Order removed from your history." }
  } catch {
    return {
      ok: false,
      message: "Could not remove this order. Please try again.",
    }
  }
}

export async function redeemCustomerReward(rewardId: string) {
  const customer = await requireCustomerSession()
  if (!idSchema.safeParse(rewardId).success)
    return { ok: false, message: "Select a valid reward." }
  try {
    const source = await getInitializedDataSource()
    const redeemedName = await source.transaction(async (manager) => {
      const customers = manager.getRepository(Customer)
      const customerRecord = await customers
        .createQueryBuilder("customer")
        .setLock("pessimistic_write")
        .where("customer.id = :id", { id: customer.id })
        .getOne()
      if (!customerRecord) throw new Error("Customer account not found.")
      const rewards = manager.getRepository(LoyaltyReward)
      const reward = await rewards
        .createQueryBuilder("reward")
        .setLock("pessimistic_write")
        .where("reward.id = :id", { id: rewardId })
        .getOne()
      if (!reward || !reward.isActive)
        throw new Error("This reward is no longer available.")
      if (customerRecord.loyaltyPointsBalance < reward.pointsCost)
        throw new Error("You do not have enough points for this reward.")
      customerRecord.loyaltyPointsBalance -= reward.pointsCost
      customerRecord.updatedAt = new Date()
      await customers.save(customerRecord)
      await manager.getRepository(LoyaltyTransaction).save(
        manager.getRepository(LoyaltyTransaction).create({
          id: randomUUID(),
          customerId: customerRecord.id,
          orderId: null,
          type: "redeem",
          points: -reward.pointsCost,
          balanceAfter: customerRecord.loyaltyPointsBalance,
          rewardId: reward.id,
          rewardName: reward.name,
        })
      )
      return reward.name
    })
    refreshCustomerPages()
    return { ok: true, message: `${redeemedName} redeemed successfully.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Customer account not found.",
      "This reward is no longer available.",
      "You do not have enough points for this reward.",
    ].includes(message)
    return {
      ok: false,
      message: known
        ? message
        : "Could not redeem this reward. Please try again.",
    }
  }
}

export async function getCustomerDigitalReceipt(orderId: string) {
  const customer = await requireCustomerSession()
  return getCustomerDigitalReceiptForApi(orderId, customer)
}

export async function getCustomerDigitalReceiptForApi(
  orderId: string,
  customer: Customer
) {
  if (!idSchema.safeParse(orderId).success) return null
  const source = await getInitializedDataSource()
  const [order, settings] = await Promise.all([
    source.getRepository(Order).findOne({
      where: { id: orderId, customerId: customer.id, paymentStatus: "paid" },
      relations: { items: { menuItem: true }, payments: true },
    }),
    source.getRepository(SystemSetting).findOne({ where: {} }),
  ])
  if (!order || !settings) return null
  const payment = [...(order.payments ?? [])].sort(
    (a, b) => b.paidAt.getTime() - a.paidAt.getTime()
  )[0]
  const taxableSubtotal = Math.max(
    0,
    Number(order.subtotal) - Number(order.discount)
  )
  const serviceCharge = Math.max(
    0,
    Number(order.total) -
      taxableSubtotal -
      Number(order.deliveryFee ?? 0) -
      (settings.vatEnabled && !settings.vatInclusive ? Number(order.tax) : 0)
  )
  return {
    settings: {
      restaurantName: settings.restaurantName,
      branchName: settings.branchName,
      contactNumber: settings.contactNumber,
      email: settings.email,
      address: settings.address,
      tinNumber: settings.tinNumber,
      birMin: settings.birMin,
      currencySymbol: settings.currencySymbol,
      currencyCode: settings.currencyCode,
      vatEnabled: settings.vatEnabled,
      vatRate: Number(settings.vatRate),
      vatInclusive: settings.vatInclusive,
      serviceChargeEnabled: settings.serviceChargeEnabled,
      serviceChargeRate: Number(settings.serviceChargeRate),
      receiptHeader: settings.receiptHeader,
      receiptFooter: settings.receiptFooter,
      wifiSsid: settings.wifiSsid,
      wifiPassword: settings.wifiPassword,
      showWifiOnReceipt: settings.showWifiOnReceipt,
    },
    receipt: {
      receiptNumber: payment?.receiptNumber ?? order.orderNumber,
      date: (payment?.paidAt ?? order.createdAt).toISOString(),
      items: order.items.map((item) => ({
        name: item.menuItem?.name ?? "Menu item",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      paymentMethod: payment?.paymentMethod ?? order.paymentMethod ?? "Paid",
      cashier: "PRIME",
      totals: {
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        serviceCharge,
        deliveryFee: Number(order.deliveryFee ?? 0),
        total: Number(order.total),
      },
    },
  }
}
