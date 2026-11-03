import { getInitializedDataSource } from "@/lib/database/data-source"
import { In } from "typeorm"
import { Order } from "@/lib/database/entities/entities/Order"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { TableWorkspace } from "./table-workspace"

export default async function TablesPage() {
  try {
    const source = await getInitializedDataSource()
    const tables = await source
      .getRepository(RestaurantTable)
      .find({ order: { tableNumber: "ASC" } })
    const activeOrders = await source.getRepository(Order).find({
      where: { status: In(["pending", "preparing", "ready", "served"]) },
      select: { id: true, orderNumber: true, tableId: true },
    })
    const orderByTable = new Map<string, string>()
    activeOrders.forEach((order) => {
      if (order.tableId) orderByTable.set(order.tableId, order.orderNumber)
    })
    return (
      <TableWorkspace
        tables={tables.map((table) => ({
          id: table.id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          qrCodeUrl: table.qrCodeUrl,
          status: table.status,
          activeOrderNumber: orderByTable.get(table.id) ?? null,
        }))}
      />
    )
  } catch (error) {
    console.error("Unable to load table setup:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            QR / Table Setup
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage tables, their QR links, and live availability.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect table setup."
            : "Tables could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
