"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { useState } from "react"
import {
  ArrowDownToLine,
  BrainCircuit,
  CircleDollarSign,
  ClipboardList,
  FileSpreadsheet,
  Percent,
  ReceiptText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SalesReportData } from "@/lib/sales/report-data"
import { SalesForecast } from "./sales-forecast"

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value)
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value))
const paymentColors = [
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#64748b",
]

const salesChartConfig = {
  sales: { label: "Sales", color: "#f59e0b" },
} satisfies ChartConfig

export function SalesReportsWorkspace({
  data,
  title = "Sales & Reports",
  description = "Track completed sales, menu performance, payments, and order activity.",
  basePath = "/admin",
}: {
  data: SalesReportData
  title?: string
  description?: string
  basePath?: "/admin" | "/cashier"
}) {
  const paymentConfig = Object.fromEntries(
    data.payments.map((payment, index) => [
      payment.method,
      {
        label: payment.method.toUpperCase(),
        color: paymentColors[index % paymentColors.length],
      },
    ])
  ) satisfies ChartConfig
  const paymentChartData = data.payments.map((payment) => ({
    ...payment,
    fill: `var(--color-${payment.method})`,
  }))
  const maxStatus = Math.max(1, ...data.statuses.map((status) => status.count))
  const maxItemSales = Math.max(1, ...data.topItems.map((item) => item.sales))
  const [activeDetail, setActiveDetail] = useState<
    "overview" | "items" | "status" | "orders" | "forecast"
  >("overview")
  const reportPath = `${basePath}/sales`
  const downloadUrl = `${basePath}/reports/download?start=${data.range.start}&end=${data.range.end}`

  return (
    <main className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={`${downloadUrl}&format=pdf`}>
              <ArrowDownToLine /> PDF
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`${downloadUrl}&format=excel`}>
              <FileSpreadsheet /> Excel
            </a>
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Sales report sections"
        className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1"
      >
        <DetailTab
          id="overview"
          active={activeDetail}
          onSelect={setActiveDetail}
        >
          Overview
        </DetailTab>
        <DetailTab id="items" active={activeDetail} onSelect={setActiveDetail}>
          Top-selling items
        </DetailTab>
        <DetailTab id="status" active={activeDetail} onSelect={setActiveDetail}>
          Order status
        </DetailTab>
        <DetailTab id="orders" active={activeDetail} onSelect={setActiveDetail}>
          Recent orders
        </DetailTab>
        <DetailTab
          id="forecast"
          active={activeDetail}
          onSelect={setActiveDetail}
        >
          <span className="inline-flex items-center gap-1.5">
            <BrainCircuit className="size-3.5" /> Forecast
          </span>
        </DetailTab>
      </div>

      {activeDetail === "overview" && (
        <section
          role="tabpanel"
          id="sales-report-panel-overview"
          aria-labelledby="sales-report-tab-overview"
          tabIndex={0}
          className="space-y-5"
        >
          <form
            className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3"
            action={reportPath}
          >
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Start date
              <Input
                name="start"
                type="date"
                defaultValue={data.range.start}
                required
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              End date
              <Input
                name="end"
                type="date"
                defaultValue={data.range.end}
                required
              />
            </label>
            <Button type="submit" variant="outline">
              Apply dates
            </Button>
            <span className="pb-2 text-xs text-muted-foreground">
              Completed-order sales; payments use payment date.
            </span>
          </form>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              title="Completed sales"
              value={currency(data.summary.sales)}
              note="Completed orders in range"
              icon={<CircleDollarSign />}
            />
            <Metric
              title="Completed orders"
              value={data.summary.orders.toLocaleString()}
              note={`Average ${currency(data.summary.averageOrder)} per order`}
              icon={<ClipboardList />}
            />
            <Metric
              title="Discounts applied"
              value={currency(data.summary.discounts)}
              note={`Tax recorded ${currency(data.summary.tax)}`}
              icon={<Percent />}
            />
            <Metric
              title="Payments collected"
              value={currency(data.summary.paymentsCollected)}
              note="From recorded payment entries"
              icon={<ReceiptText />}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Sales over time</CardTitle>
                <CardDescription>
                  Completed orders by order date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={salesChartConfig}
                  className="h-[280px] w-full"
                >
                  <AreaChart
                    data={data.daily}
                    margin={{ left: 4, right: 12, top: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="reportSalesFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-sales)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-sales)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat("en-PH", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => currency(Number(value))}
                        />
                      }
                    />
                    <Area
                      dataKey="sales"
                      type="monotone"
                      fill="url(#reportSalesFill)"
                      stroke="var(--color-sales)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments by method</CardTitle>
                <CardDescription>
                  Recorded payments by paid date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.payments.length ? (
                  <>
                    <ChartContainer
                      config={paymentConfig}
                      className="mx-auto h-[205px] w-full max-w-[260px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => currency(Number(value))}
                            />
                          }
                        />
                        <Pie
                          data={paymentChartData}
                          dataKey="amount"
                          nameKey="method"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {paymentChartData.map((payment) => (
                            <Cell key={payment.method} fill={payment.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-2">
                      {data.payments.map((payment, index) => (
                        <div
                          key={payment.method}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2 truncate">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  paymentColors[index % paymentColors.length],
                              }}
                            />
                            {payment.method.toUpperCase()}{" "}
                            <span className="text-muted-foreground">
                              ({payment.count})
                            </span>
                          </span>
                          <span className="font-medium tabular-nums">
                            {currency(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Empty>No payment records for this date range.</Empty>
                )}
              </CardContent>
            </Card>
          </section>
        </section>
      )}

      <section className="space-y-3">
        {activeDetail === "forecast" && (
          <SalesForecast history={data.forecastHistory} basePath={basePath} />
        )}
        {activeDetail === "items" && (
          <Card
            role="tabpanel"
            id="sales-report-panel-items"
            aria-labelledby="sales-report-tab-items"
            tabIndex={0}
          >
            <CardHeader>
              <CardTitle>Top-selling menu items</CardTitle>
              <CardDescription>
                Completed order items, ranked by sales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topItems.length ? (
                data.topItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {item.quantity} sold
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{
                            width: `${Math.max(2, (item.sales / maxItemSales) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="min-w-24 text-right text-sm font-medium tabular-nums">
                      {currency(item.sales)}
                    </span>
                  </div>
                ))
              ) : (
                <Empty>No completed item sales for this date range.</Empty>
              )}
            </CardContent>
          </Card>
        )}

        {activeDetail === "status" && (
          <Card
            role="tabpanel"
            id="sales-report-panel-status"
            aria-labelledby="sales-report-tab-status"
            tabIndex={0}
          >
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <CardDescription>
                All orders created during the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.statuses.length ? (
                data.statuses.map((status) => (
                  <div
                    key={status.status}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          status.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {status.status.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-lg font-semibold tabular-nums">
                        {status.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${Math.max(2, (status.count / maxStatus) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <Empty>No orders for this date range.</Empty>
              )}
            </CardContent>
          </Card>
        )}

        {activeDetail === "orders" && (
          <Card
            role="tabpanel"
            id="sales-report-panel-orders"
            aria-labelledby="sales-report-tab-orders"
            tabIndex={0}
          >
            <CardHeader>
              <CardTitle>Recent sales and orders</CardTitle>
              <CardDescription>
                Latest 30 orders for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type / table</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {dateTime(order.createdAt)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.orderType}
                          {order.tableNumber ? ` · ${order.tableNumber}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "cancelled"
                                ? "destructive"
                                : order.status === "completed"
                                  ? "default"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.paymentMethod ??
                            order.paymentStatus.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {currency(order.discount)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {currency(order.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data.recentOrders.length && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Empty>No orders in this date range.</Empty>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

function Metric({
  title,
  value,
  note,
  icon,
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
        </div>
        <span className="rounded-md bg-muted p-2 text-muted-foreground">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function DetailTab({
  id,
  active,
  onSelect,
  children,
}: {
  id: "overview" | "items" | "status" | "orders" | "forecast"
  active: "overview" | "items" | "status" | "orders" | "forecast"
  onSelect: (
    id: "overview" | "items" | "status" | "orders" | "forecast"
  ) => void
  children: React.ReactNode
}) {
  const selected = active === id
  return (
    <button
      type="button"
      role="tab"
      id={`sales-report-tab-${id}`}
      aria-controls={`sales-report-panel-${id}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(id)}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${selected ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}
