import { NextResponse } from "next/server"
import { IsNull } from "typeorm"
import { getStaffSession } from "@/lib/staff-auth/session"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Order } from "@/lib/database/entities/entities/Order"
import type { LiveOrder } from "@/app/admin/(workspace)/orders/types"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const staff = await getStaffSession()
  const isAdmin = /^(admin|administrator)$/i.test(staff?.roleName.trim() ?? "")
  if (!staff || (!isAdmin && !staff.permissionCodes.includes("orders:view")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { orderId } = await params
  const order = await (await getInitializedDataSource())
    .getRepository(Order)
    .findOne({
      where: { id: orderId, adminHiddenAt: IsNull() },
      relations: {
        table: true,
        customer: true,
        items: { menuItem: true },
        statusHistory: true,
        payments: true,
      },
    })
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const payment = [...(order.payments ?? [])].sort(
    (a, b) => b.paidAt.getTime() - a.paidAt.getTime()
  )[0]
  const liveOrder: LiveOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    customerPaymentReference: order.customerPaymentReference,
    receiptNumber: payment?.receiptNumber ?? null,
    paidAt: payment?.paidAt.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    customerName: order.customer?.name ?? null,
    customerContact: order.customer?.contactNumber ?? null,
    tableNumber: order.table?.tableNumber ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem?.name ?? "Removed menu item",
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      notes: item.notes,
    })),
    statusHistory: order.statusHistory
      .slice()
      .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())
      .map((history) => ({
        status: history.status,
        changedAt: history.changedAt.toISOString(),
      })),
  }

  return NextResponse.json(liveOrder, {
    headers: { "Cache-Control": "no-store" },
  })
}
