"use client"

import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminDashboardData } from "@/lib/admin/dashboard-data"

/* ------------------------------ CHART CONFIGS ------------------------------ */

const salesConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
} satisfies ChartConfig
const topConfig = {
  qty: { label: "Sold", color: "#3b82f6" },
} satisfies ChartConfig

const statusConfig = {
  completed: { label: "Completed", color: "#10b981" },
  served: { label: "Served", color: "#0ea5e9" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  preparing: { label: "Preparing", color: "#3b82f6" },
  pending: { label: "Pending", color: "#f59e0b" },
  ready: { label: "Ready", color: "#8b5cf6" },
} satisfies ChartConfig

const paymentConfig = {
  cash: { label: "Cash", color: "#10b981" },
  gcash: { label: "GCash", color: "#3b82f6" },
  maya: { label: "Maya", color: "#8b5cf6" },
  qrph: { label: "QRPH", color: "#06b6d4" },
  card: { label: "Card", color: "#f59e0b" },
  other: { label: "Other", color: "#64748b" },
} satisfies ChartConfig

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  preparing: "secondary",
  ready: "secondary",
  completed: "default",
  cancelled: "destructive",
}

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n)
const pesoFull = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    n
  )

/* DONUT START */
const compactPeso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)

/**
 * Donut + center total + legend na may bilang.
 * - custom legend (hindi recharts legend): hindi napuputol sa makitid na card
 * - minAngle: nakikita pa rin ang maliliit na slice kahit malaki ang isa
 */
function Donut({
  config,
  data,
  centerLabel,
  formatValue = (n: number) => String(n),
  formatCenter = formatValue,
}: {
  config: ChartConfig
  data: { key: string; value: number }[]
  centerLabel: string
  formatValue?: (n: number) => string
  formatCenter?: (n: number) => string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const rows = data.map((d) => ({ ...d, fill: `var(--color-${d.key})` }))

  return (
    <div>
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-[220px]"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                formatter={(v, n) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[String(n)]?.label ?? n}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatValue(Number(v))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={rows}
            dataKey="value"
            nameKey="key"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={2}
            minAngle={8}
            strokeWidth={0}
          >
            {rows.map((r) => (
              <Cell key={r.key} fill={r.fill} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox && "cy" in viewBox ? (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 6}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {formatCenter(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 16}
                      className="fill-muted-foreground text-xs"
                    >
                      {centerLabel}
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: config[r.key]?.color }}
              />
              <span className="truncate">{config[r.key]?.label}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatValue(r.value)}
              <span className="ml-2 inline-block w-10 text-right text-xs">
                {!total
                  ? "0%"
                  : r.value > 0 && r.value / total < 0.01
                    ? "<1%"
                    : `${Math.round((r.value / total) * 100)}%`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
/* DONUT END */

/* ------------------------------ PAGE ------------------------------ */

export function DashboardWorkspace({
  initialData,
}: {
  initialData: AdminDashboardData
}) {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh()
    }
    const timer = window.setInterval(refresh, 20_000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [router])

  const data = initialData
  const salesTotal = data.sales.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="space-y-6 p-2">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            Overview of sales and operations · {data.sales[0]?.day} –{" "}
            {data.sales.at(-1)?.day}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          Live · refreshes every 20 seconds
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <Card key={k.title}>
            <CardHeader>
              <CardDescription>{k.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {k.title === "Revenue Today" || k.title === "Avg. Order Value"
                  ? pesoFull(Number(k.value))
                  : k.value}
              </CardTitle>
              {k.change !== null && (
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      k.change >= 0 ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {k.change >= 0 ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {Math.abs(k.change).toFixed(1)}%
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              {k.footer}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Sales + order status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales</CardTitle>
            <CardDescription>Last 7 days · {peso(salesTotal)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={salesConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart data={data.sales} margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={peso}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-mono font-medium tabular-nums">
                            {pesoFull(Number(value))}
                          </span>
                          <span className="text-muted-foreground">
                            {item.payload.orders} orders
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut
              config={statusConfig}
              data={data.orderStatus}
              centerLabel="orders"
            />
          </CardContent>
        </Card>
      </div>

      {/* Top items + payment methods */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Based on sales</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={topConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <BarChart
                data={data.topItems}
                layout="vertical"
                margin={{ left: 0, right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="qty" fill="var(--color-qty)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Collected, Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut
              config={paymentConfig}
              data={data.payments}
              centerLabel="nakolekta"
              formatValue={peso}
              formatCenter={compactPeso}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders today</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Oras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((o) => (
                  <TableRow key={o.no}>
                    <TableCell className="font-medium">{o.no}</TableCell>
                    <TableCell>{o.table}</TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[o.status] ?? "outline"}
                        className="capitalize"
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {pesoFull(o.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {o.time}
                    </TableCell>
                  </TableRow>
                ))}
                {data.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No orders today yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> Low Stock
            </CardTitle>
            <CardDescription>Stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.lowStock.map((i) => (
              <div key={i.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    <span className="font-semibold text-red-600">
                      {i.stock}
                    </span>{" "}
                    / {i.threshold} {i.unit}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{
                      width: `${Math.min(100, Math.round((i.stock / i.threshold) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {data.lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No items are below their reorder threshold.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
