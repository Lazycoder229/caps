import { getInitializedDataSource } from "@/lib/database/data-source"
import { InventoryItem } from "@/lib/database/entities/entities/InventoryItem"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderItem } from "@/lib/database/entities/entities/OrderItem"
import { Payment } from "@/lib/database/entities/entities/Payment"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { dateOnlyInManila } from "@/lib/dates/date-only"

const shiftDay = (day: string, amount: number) => {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00.000Z`))

const number = (value: unknown) => Number(value ?? 0) || 0
// MySQL TIMESTAMP values are exposed in the connection's session timezone.
// Convert both the range bounds and grouping key to the app's Manila timezone
// so a UTC database session cannot shift completed sales into another day.
const manilaOrderDate =
  "CONVERT_TZ(order.createdAt, @@session.time_zone, '+08:00')"
const manilaRange = (column: string) =>
  `${column} >= CONVERT_TZ(:start, '+08:00', @@session.time_zone) AND ${column} < CONVERT_TZ(:end, '+08:00', @@session.time_zone)`
const percentChange = (current: number, previous: number) =>
  previous === 0
    ? current === 0
      ? 0
      : null
    : ((current - previous) / previous) * 100

export type AdminDashboardData = {
  today: string
  kpis: Array<{
    title: string
    value: string
    change: number | null
    footer: string
  }>
  sales: Array<{ day: string; revenue: number; orders: number }>
  orderStatus: Array<{ key: string; value: number }>
  topItems: Array<{ name: string; qty: number }>
  payments: Array<{ key: string; value: number }>
  recentOrders: Array<{
    no: string
    table: string
    status: string
    total: number
    time: string
  }>
  lowStock: Array<{
    name: string
    unit: string
    stock: number
    threshold: number
  }>
}

export async function getAdminDashboardData(
  now = new Date()
): Promise<AdminDashboardData> {
  const today = dateOnlyInManila(now)
  const yesterday = shiftDay(today, -1)
  const weekStart = shiftDay(today, -6)
  const todayStart = `${today} 00:00:00`
  const tomorrowStart = `${shiftDay(today, 1)} 00:00:00`
  const yesterdayStart = `${yesterday} 00:00:00`
  const weekStartInclusive = `${weekStart} 00:00:00`
  const source = await getInitializedDataSource()
  const orders = source.getRepository(Order)
  const completedToday = () =>
    orders
      .createQueryBuilder("order")
      .where("order.status = :status", { status: "completed" })
      .andWhere(manilaRange("order.createdAt"))

  const [
    todaySummary,
    yesterdaySummary,
    activeOrders,
    dailyRows,
    statusRows,
    itemRows,
    paymentRows,
    recent,
    stockRows,
  ] = await Promise.all([
    completedToday()
      .setParameters({ start: todayStart, end: tomorrowStart })
      .select("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(order.total), 0)", "sales")
      .getRawOne(),
    completedToday()
      .setParameters({ start: yesterdayStart, end: todayStart })
      .select("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(order.total), 0)", "sales")
      .getRawOne(),
    orders.count({
      where: [
        { status: "pending" },
        { status: "preparing" },
        { status: "ready" },
        { status: "served" },
      ],
    }),
    orders
      .createQueryBuilder("order")
      .select(`DATE(${manilaOrderDate})`, "date")
      .addSelect("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(order.total), 0)", "revenue")
      .where("order.status = :status", { status: "completed" })
      .andWhere(manilaRange("order.createdAt"), {
        start: weekStartInclusive,
        end: tomorrowStart,
      })
      .groupBy(`DATE(${manilaOrderDate})`)
      .getRawMany(),
    orders
      .createQueryBuilder("order")
      .select("order.status", "status")
      .addSelect("COUNT(*)", "count")
      .where(manilaRange("order.createdAt"), {
        start: weekStartInclusive,
        end: tomorrowStart,
      })
      .groupBy("order.status")
      .getRawMany(),
    source
      .getRepository(OrderItem)
      .createQueryBuilder("item")
      .innerJoin("item.order", "order")
      .innerJoin("item.menuItem", "menuItem")
      .select("menuItem.name", "name")
      .addSelect("SUM(item.quantity)", "qty")
      .where("order.status = :status", { status: "completed" })
      .andWhere(manilaRange("order.createdAt"), {
        start: weekStartInclusive,
        end: tomorrowStart,
      })
      .groupBy("item.menuItemId")
      .addGroupBy("menuItem.name")
      .orderBy("qty", "DESC")
      .limit(5)
      .getRawMany(),
    source
      .getRepository(Payment)
      .createQueryBuilder("payment")
      .select("payment.paymentMethod", "method")
      .addSelect("COALESCE(SUM(payment.amountPaid), 0)", "amount")
      .where(manilaRange("payment.paidAt"), {
        start: weekStartInclusive,
        end: tomorrowStart,
      })
      .groupBy("payment.paymentMethod")
      .getRawMany(),
    orders
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.table", "table")
      .where(manilaRange("order.createdAt"), {
        start: todayStart,
        end: tomorrowStart,
      })
      .orderBy("order.createdAt", "DESC")
      .take(6)
      .getMany(),
    source.getRepository(InventoryItem).find({ where: { isActive: true } }),
  ])

  const [tableCount, occupiedTables] = await Promise.all([
    source.getRepository(RestaurantTable).count(),
    source
      .getRepository(RestaurantTable)
      .count({ where: { status: "occupied" } }),
  ])
  const sales = number(todaySummary?.sales)
  const orderCount = number(todaySummary?.orders)
  const average = orderCount > 0 ? sales / orderCount : 0
  const previousSales = number(yesterdaySummary?.sales)
  const previousOrders = number(yesterdaySummary?.orders)
  const previousAverage =
    previousOrders > 0 ? previousSales / previousOrders : 0

  const dailyMap = new Map<string, { revenue: number; orders: number }>(
    dailyRows.map((row: Record<string, unknown>) => [
      dateOnlyInManila(
        row.date instanceof Date ? row.date : String(row.date ?? "")
      ),
      { revenue: number(row.revenue), orders: number(row.orders) },
    ])
  )
  const daily = Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(today, index - 6)
    return {
      day: dayLabel(day),
      ...(dailyMap.get(day) ?? { revenue: 0, orders: 0 }),
    }
  })

  return {
    today,
    kpis: [
      {
        title: "Revenue Today",
        value: String(sales),
        change: percentChange(sales, previousSales),
        footer: "vs. yesterday",
      },
      {
        title: "Orders Today",
        value: String(orderCount),
        change: percentChange(orderCount, previousOrders),
        footer: "Completed orders",
      },
      {
        title: "Avg. Order Value",
        value: String(average),
        change: percentChange(average, previousAverage),
        footer: "Today",
      },
      {
        title: "Active Orders",
        value: String(activeOrders),
        change: null,
        footer: `${occupiedTables}/${tableCount} tables occupied`,
      },
    ],
    sales: daily,
    orderStatus: statusRows.map((row: Record<string, unknown>) => ({
      key: String(row.status),
      value: number(row.count),
    })),
    topItems: itemRows.map((row: Record<string, unknown>) => ({
      name: String(row.name),
      qty: number(row.qty),
    })),
    payments: paymentRows.map((row: Record<string, unknown>) => ({
      key: String(row.method),
      value: number(row.amount),
    })),
    recentOrders: recent.map((order) => ({
      no: order.orderNumber,
      table: order.table?.tableNumber ?? "—",
      status: order.status,
      total: Number(order.total),
      time: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      }).format(order.createdAt),
    })),
    lowStock: stockRows
      .filter(
        (item) =>
          item.reorderThreshold !== null &&
          Number(item.stockQuantity) <= Number(item.reorderThreshold)
      )
      .sort((a, b) => Number(a.stockQuantity) - Number(b.stockQuantity))
      .slice(0, 6)
      .map((item) => ({
        name: item.name,
        unit: item.unit,
        stock: Number(item.stockQuantity),
        threshold: Number(item.reorderThreshold),
      })),
  }
}
