import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { In, IsNull, Not } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { getCustomerFromApiRequest } from "@/lib/customer-auth/api-session"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { CustomerDeliveryAddress, type CustomerDeliveryAddressLabel } from "@/lib/database/entities/entities/CustomerDeliveryAddress"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderVoid } from "@/lib/database/entities/entities/OrderVoid"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { OrderStatusHistory } from "@/lib/database/entities/entities/OrderStatusHistory"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { hashPassword } from "@/lib/security/password"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "no-store" }
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers })

function deliveryTrackingStatus(order: Order) {
  if (order.delivery?.status === "failed") return "failed"
  switch (order.status) {
    case "preparing": return "preparing"
    case "ready": return "ready"
    case "served": return "out_for_delivery"
    case "completed": return "received"
    case "cancelled": return "cancelled"
    default: return "pending"
  }
}

async function authenticated(request: Request) {
  const customer = await getCustomerFromApiRequest(request)
  return customer && !customer.isGuest ? customer : null
}

export async function GET(request: Request) {
  const customer = await authenticated(request)
  if (!customer) return json({ error: "Sign in to continue." }, 401)
  const source = await getInitializedDataSource()
  const [orders, reservations, rewards, transactions, earned, deliveryAddresses] = await Promise.all([
    source.getRepository(Order).find({
      where: { customerId: customer.id, customerHiddenAt: IsNull() },
      relations: { items: { menuItem: true }, payments: true, voids: true, delivery: true },
      order: { createdAt: "DESC" }, take: 200,
    }),
    source.getRepository(Reservation).find({
      where: { customerId: customer.id }, relations: { table: true },
      order: { reservationDate: "ASC", reservationTime: "ASC" }, take: 200,
    }),
    source.getRepository(LoyaltyReward).find({ where: { isActive: true }, order: { pointsCost: "ASC" } }),
    source.getRepository(LoyaltyTransaction).find({ where: { customerId: customer.id }, order: { createdAt: "DESC" }, take: 100 }),
    source.getRepository(LoyaltyTransaction).createQueryBuilder("tx").select("COALESCE(SUM(tx.points), 0)", "total").where("tx.customerId = :id", { id: customer.id }).andWhere("tx.type = 'earn'").getRawOne<{ total: string }>(),
    source.getRepository(CustomerDeliveryAddress).find({ where: { customerId: customer.id }, order: { label: "ASC" } }),
  ])
  return json({
    customer: { id: customer.id, name: customer.name, email: customer.email, contactNumber: customer.contactNumber, loyaltyPointsBalance: customer.loyaltyPointsBalance, createdAt: customer.createdAt },
    deliveryAddresses: deliveryAddresses.map((address) => ({ label: address.label, recipientName: address.recipientName, contactNumber: address.contactNumber, address: address.address, latitude: address.latitude == null ? null : Number(address.latitude), longitude: address.longitude == null ? null : Number(address.longitude), instructions: address.instructions, isDefault: address.isDefault })),
    orders: orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, orderType: o.orderType, status: o.status, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod, total: Number(o.total), deliveryFee: Number(o.deliveryFee ?? 0), delivery: o.delivery ? { address: o.delivery.address, latitude: Number(o.delivery.latitude), longitude: Number(o.delivery.longitude), recipientName: o.delivery.recipientName, recipientPhone: o.delivery.recipientPhone, instructions: o.delivery.instructions, status: deliveryTrackingStatus(o) } : null, discount: Number(o.discount), createdAt: o.createdAt, paymentReferenceToken: o.paymentReferenceToken, receiptAvailable: o.paymentStatus === "paid", receiptNumber: [...o.payments].sort((a,b) => b.paidAt.getTime()-a.paidAt.getTime())[0]?.receiptNumber ?? null, pendingCancellation: o.voids.some((v: OrderVoid) => v.status === "pending"), voidStatus: [...o.voids].sort((a,b) => b.requestedAt.getTime()-a.requestedAt.getTime())[0]?.status ?? null, items: o.items.map((i) => ({ id: i.id, name: i.menuItem?.name ?? "Menu item", quantity: i.quantity, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal), notes: i.notes })) })),
    reservations: reservations.map((r) => ({ id: r.id, reservationDate: r.reservationDate, reservationTime: r.reservationTime.slice(0,5), numberOfGuests: r.numberOfGuests, status: r.status, notes: r.notes, tableNumber: r.table?.tableNumber ?? null })),
    rewards, transactions, earnedPoints: Number(earned?.total ?? 0),
  })
}

export async function POST(request: Request) {
  const customer = await authenticated(request)
  if (!customer) return json({ error: "Sign in to continue." }, 401)
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.action !== "string") return json({ error: "Invalid request." }, 400)
  const source = await getInitializedDataSource()
  try {
    if (body.action === "profile") {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
      const contactNumber = typeof body.contactNumber === "string" ? body.contactNumber.trim() : ""
      if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || contactNumber.length > 20) return json({ error: "Check your profile details." }, 400)
      let savedAddresses: Array<Omit<CustomerDeliveryAddress, "customerId">> | undefined
      let defaultAddress: CustomerDeliveryAddressLabel | null = null
      if (body.deliveryAddresses !== undefined) {
        if (!Array.isArray(body.deliveryAddresses) || body.deliveryAddresses.length > 2) return json({ error: "Check your saved delivery addresses." }, 400)
        const labels = new Set<string>()
        savedAddresses = []
        for (const item of body.deliveryAddresses) {
          if (!item || typeof item !== "object") return json({ error: "Check your saved delivery addresses." }, 400)
          const address = item as Record<string, unknown>
          const label = address.label
          if (label !== "home" && label !== "work") return json({ error: "Choose Home or Work for each saved address." }, 400)
          if (labels.has(label)) return json({ error: "Each saved address must have a different label." }, 400)
          labels.add(label)
          const recipientName = typeof address.recipientName === "string" ? address.recipientName.trim() : ""
          const addressText = typeof address.address === "string" ? address.address.trim() : ""
          const savedPhone = typeof address.contactNumber === "string" ? address.contactNumber.trim() : ""
          const instructions = typeof address.instructions === "string" ? address.instructions.trim() : ""
          const hasAnyDetails = Boolean(recipientName || addressText || savedPhone || instructions || address.latitude != null || address.longitude != null)
          if (!hasAnyDetails) continue
          const latitude = address.latitude == null || address.latitude === "" ? null : Number(address.latitude)
          const longitude = address.longitude == null || address.longitude === "" ? null : Number(address.longitude)
          if (recipientName.length < 2 || recipientName.length > 100 || addressText.length < 8 || addressText.length > 2000 || savedPhone.length < 7 || savedPhone.length > 20 || instructions.length > 2000 || ((latitude === null) !== (longitude === null)) || (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) return json({ error: `Check the ${label} delivery address and map pin.` }, 400)
          savedAddresses.push({ label, recipientName, contactNumber: savedPhone, address: addressText, latitude, longitude, instructions: instructions || null, isDefault: false })
        }
        const requestedDefault = body.defaultDeliveryAddress
        if (requestedDefault === "home" || requestedDefault === "work") {
          if (!savedAddresses.some((address) => address.label === requestedDefault)) return json({ error: "The preferred address needs to be saved first." }, 400)
          defaultAddress = requestedDefault
          savedAddresses = savedAddresses.map((address) => ({ ...address, isDefault: address.label === defaultAddress }))
        }
      }
      const repository = source.getRepository(Customer)
      const duplicateEmail = await repository.createQueryBuilder("customer").where("LOWER(customer.email) = :email", { email }).andWhere("customer.id != :id", { id: customer.id }).getOne()
      if (duplicateEmail) return json({ error: "That email address is already in use." }, 409)
      await source.transaction(async (manager) => {
        await manager.getRepository(Customer).update(customer.id, { name, email, contactNumber: contactNumber || null, updatedAt: new Date() })
        if (savedAddresses) {
          const addressRepository = manager.getRepository(CustomerDeliveryAddress)
          await addressRepository.delete({ customerId: customer.id })
          if (savedAddresses.length) await addressRepository.save(savedAddresses.map((address) => ({ ...address, customerId: customer.id })))
        }
      })
      return json({ ok: true, message: "Your profile has been updated." })
    }
    if (body.action === "changePassword") {
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
      const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""
      if (newPassword.length < 8 || newPassword.length > 100 || confirmPassword !== newPassword)
        return json({ error: "Enter a matching new password of at least 8 characters." }, 400)
      const record = await source.getRepository(Customer)
        .createQueryBuilder("customer")
        .addSelect("customer.password")
        .where("customer.id = :id", { id: customer.id })
        .andWhere("customer.isGuest = :isGuest", { isGuest: false })
        .getOne()
      if (!record?.password)
        return json({ error: "Password changes are unavailable for this account." }, 400)
      record.password = hashPassword(newPassword)
      record.updatedAt = new Date()
      await source.getRepository(Customer).save(record)
      return json({ ok: true, message: "Your password has been changed." })
    }
    if (body.action === "reservation") {
      const date = String(body.reservationDate ?? ""), time = String(body.reservationTime ?? "")
      const contactNumber = String(body.contactNumber ?? "").trim(), guests = Number(body.numberOfGuests), notes = String(body.notes ?? "").trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !contactNumber || contactNumber.length > 20 || !Number.isInteger(guests) || guests < 1 || guests > 100 || notes.length > 2000) return json({ error: "Check your reservation details." }, 400)
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23" }).formatToParts(new Date())
      const now = Object.fromEntries(parts.map((p) => [p.type,p.value]))
      const today = `${now.year}-${now.month}-${now.day}`, current = `${now.hour}:${now.minute}`
      if (date < today || (date === today && time <= current)) return json({ error: "Choose a future date and time." }, 400)
      await source.getRepository(Reservation).save({ id: randomUUID(), customerId: customer.id, customerName: customer.name, contactNumber, email: customer.email, tableId: null, reservationDate: date, reservationTime: `${time}:00`, numberOfGuests: guests, status: "pending", notes: notes || null, createdByStaffId: null })
      return json({ ok: true, message: "Reservation request sent. We’ll confirm it as soon as possible." })
    }
    if (body.action === "cancelReservation") {
      const row = await source.getRepository(Reservation).findOneBy({ id: String(body.id), customerId: customer.id })
      if (!row) return json({ error: "Reservation not found." }, 404)
      if (!["pending", "confirmed"].includes(row.status)) return json({ error: "This reservation can no longer be cancelled." }, 400)
      const nowParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
      const now = Object.fromEntries(nowParts.map((part) => [part.type, part.value]))
      const today = `${now.year}-${now.month}-${now.day}`, currentTime = `${now.hour}:${now.minute}`
      if (row.reservationDate < today || (row.reservationDate === today && row.reservationTime.slice(0, 5) <= currentTime)) return json({ error: "This reservation time has already passed." }, 400)
      row.status = "cancelled"; await source.getRepository(Reservation).save(row)
      return json({ ok: true, message: "Reservation cancelled." })
    }
    if (body.action === "removeOrder") {
      const result = await source.getRepository(Order).createQueryBuilder().update(Order).set({ customerHiddenAt: new Date() }).where("id = :id", { id: String(body.orderId) }).andWhere("customer_id = :customerId", { customerId: customer.id }).andWhere("status IN (:...statuses)", { statuses: ["completed", "cancelled"] }).andWhere("customer_hidden_at IS NULL").execute()
      return result.affected ? json({ ok: true, message: "Order removed from your history." }) : json({ error: "Only completed or cancelled orders can be removed." }, 400)
    }
    if (body.action === "cancelOrder") {
      const orderId = String(body.orderId), reason = typeof body.reason === "string" ? body.reason.trim() : ""
      if (!/^[0-9a-f-]{36}$/i.test(orderId) || reason.length < 3 || reason.length > 1000) return json({ error: "Enter a valid cancellation reason." }, 400)
      const message = await source.transaction(async (manager) => {
        const orders = manager.getRepository(Order)
        const order = await orders.createQueryBuilder("order").setLock("pessimistic_write").where("order.id = :orderId", { orderId }).andWhere("order.customerId = :customerId", { customerId: customer.id }).getOne()
        if (!order) throw new Error("Order not found.")
        if (order.status !== "pending") throw new Error("Cancellation requests are available only before the order starts preparing.")
        if (await manager.getRepository(OrderVoid).findOneBy({ orderId, status: "pending" })) throw new Error("A cancellation request is already under review.")
        const settings = await manager.getRepository(SystemSetting).findOne({ where: {} })
        const autoApprove = !(settings?.managerApprovalForVoids ?? true) && order.paymentStatus !== "paid"
        await manager.getRepository(OrderVoid).save({ id: randomUUID(), orderId, requestedByStaffId: null, approvedByStaffId: null, reason, status: autoApprove ? "approved" : "pending", resolvedAt: autoApprove ? new Date() : null, resolutionNotes: autoApprove ? "Automatically approved because manager approval for voids is disabled." : null })
        if (autoApprove) {
          order.status = "cancelled"; order.updatedAt = new Date(); await orders.save(order)
          await manager.getRepository(OrderStatusHistory).save({ id: randomUUID(), orderId, status: "cancelled", changedByStaffId: null })
          if (order.tableId) {
            const active = await orders.count({ where: { tableId: order.tableId, id: Not(order.id), status: In(["pending", "preparing", "ready"]) } })
            if (!active) {
              const table = await manager.getRepository(RestaurantTable).findOneBy({ id: order.tableId })
              if (table) { table.status = "available"; table.occupiedAt = null; await manager.getRepository(RestaurantTable).save(table) }
            }
          }
        }
        return autoApprove ? "Your order has been cancelled." : "Your cancellation request was sent to the restaurant for review."
      })
      return json({ ok: true, message })
    }
    if (body.action === "redeem") {
      const rewardId = String(body.rewardId)
      return await source.transaction(async (manager) => {
        const customers = manager.getRepository(Customer)
        const record = await customers.createQueryBuilder("customer").setLock("pessimistic_write").where("customer.id = :id", { id: customer.id }).getOne()
        const reward = await manager.getRepository(LoyaltyReward).findOneBy({ id: rewardId, isActive: true })
        if (!record || !reward) return json({ error: "This reward is no longer available." }, 400)
        if (record.loyaltyPointsBalance < reward.pointsCost) return json({ error: "You do not have enough points for this reward." }, 400)
        record.loyaltyPointsBalance -= reward.pointsCost; record.updatedAt = new Date(); await customers.save(record)
        await manager.getRepository(LoyaltyTransaction).save({ id: randomUUID(), customerId: record.id, orderId: null, type: "redeem", points: -reward.pointsCost, balanceAfter: record.loyaltyPointsBalance, rewardId: reward.id, rewardName: reward.name })
        return json({ ok: true, message: `${reward.name} redeemed successfully.` })
      })
    }
    return json({ error: "Unsupported action." }, 400)
  } catch (error) {
    console.error("Customer mobile action failed:", error)
    return json({ error: "Could not complete that request. Please try again." }, 500)
  }
}
