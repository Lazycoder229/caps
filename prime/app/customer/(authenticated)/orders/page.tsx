import Link from "next/link"
import { IsNull } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderVoid } from "@/lib/database/entities/entities/OrderVoid"
import { CustomerOrders } from "./workspace"

export default async function CustomerOrdersPage() {
  const customer = await requireCustomerSession()
  const orders = await (
    await getInitializedDataSource()
  )
    .getRepository(Order)
    .find({
      where: { customerId: customer.id, customerHiddenAt: IsNull() },
      relations: {
        items: { menuItem: true },
        payments: true,
        voids: true,
      },
      order: { createdAt: "DESC" },
      take: 200,
    })
  const rows = orders.map((order) => {
    const latestPayment = order.payments
      .slice()
      .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())[0]
    const pendingVoid = order.voids.find(
      (request: OrderVoid) => request.status === "pending"
    )
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
      discount: Number(order.discount),
      createdAt: order.createdAt.toISOString(),
      paymentReferenceToken: order.paymentReferenceToken,
      receiptAvailable: order.paymentStatus === "paid",
      receiptNumber: latestPayment?.receiptNumber ?? null,
      pendingCancellation: Boolean(pendingVoid),
      voidStatus:
        order.voids
          .slice()
          .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())[0]
          ?.status ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.menuItem?.name ?? "Menu item",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        notes: item.notes,
      })),
    }
  })
  return <CustomerOrders orders={rows} />
}
