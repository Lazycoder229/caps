import { In, IsNull } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderStatusHistory } from "@/lib/database/entities/entities/OrderStatusHistory"
import { OrderVoid } from "@/lib/database/entities/entities/OrderVoid"
import { VoidCancellationWorkspace } from "./workspace"
import type {
  CancelledOrderRow,
  VoidRequestRow,
  VoidableOrderOption,
} from "./types"

export default async function VoidCancellationPage() {
  try {
    const source = await getInitializedDataSource()
    const [voids, cancellationHistory, orders] = await Promise.all([
      source.getRepository(OrderVoid).find({
        relations: {
          order: { customer: true, table: true },
          requestedBy: true,
          approvedBy: true,
        },
        order: { requestedAt: "DESC" },
        take: 300,
      }),
      source.getRepository(OrderStatusHistory).find({
        where: { status: "cancelled" },
        relations: { order: { customer: true, table: true } },
        order: { changedAt: "DESC" },
        take: 300,
      }),
      source.getRepository(Order).find({
        where: {
          status: In(["pending", "preparing", "ready", "served", "completed"]),
          adminHiddenAt: IsNull(),
        },
        relations: { customer: true, table: true },
        order: { createdAt: "DESC" },
        take: 300,
      }),
    ])
    const voidRows: VoidRequestRow[] = voids.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.order?.orderNumber ?? "Removed order",
      orderStatus: item.order?.status ?? "cancelled",
      customerName: item.order?.customer?.name ?? null,
      tableNumber: item.order?.table?.tableNumber ?? null,
      total: Number(item.order?.total ?? 0),
      reason: item.reason,
      status: item.status,
      requestedAt: item.requestedAt.toISOString(),
      requestedByName: item.requestedBy?.name ?? null,
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
      approvedByName: item.approvedBy?.name ?? null,
      resolutionNotes: item.resolutionNotes,
    }))
    const approvedByOrderId = new Map(
      voids
        .filter((item) => item.status === "approved")
        .map((item) => [item.orderId, item])
    )
    const cancellationRows: CancelledOrderRow[] = cancellationHistory.map(
      (history) => {
        const approvedVoid = approvedByOrderId.get(history.orderId)
        return {
          id: history.id,
          orderId: history.orderId,
          orderNumber: history.order?.orderNumber ?? "Removed order",
          customerName: history.order?.customer?.name ?? null,
          tableNumber: history.order?.table?.tableNumber ?? null,
          total: Number(history.order?.total ?? 0),
          cancelledAt: history.changedAt.toISOString(),
          reason: approvedVoid?.reason ?? null,
          source: approvedVoid ? "approved_void" : "cancellation",
        }
      }
    )
    const pendingOrderIds = new Set(
      voids
        .filter((item) => item.status === "pending")
        .map((item) => item.orderId)
    )
    const orderOptions: VoidableOrderOption[] = orders
      .filter(
        (order) =>
          !pendingOrderIds.has(order.id) &&
          !voids.some(
            (item) => item.orderId === order.id && item.status === "approved"
          )
      )
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customer?.name ?? null,
        tableNumber: order.table?.tableNumber ?? null,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      }))

    return (
      <VoidCancellationWorkspace
        voids={voidRows}
        cancellations={cancellationRows}
        orders={orderOptions}
      />
    )
  } catch (error) {
    console.error("Unable to load void and cancellation logs:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Void / Cancellation Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Review void requests and the order cancellation history.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect void and cancellation logs."
            : "Void and cancellation logs could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
