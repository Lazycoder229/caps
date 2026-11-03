"use client"

import { useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import Link from "next/link"
import QRCode from "qrcode"
import {
  Check,
  ChefHat,
  Clock3,
  Minus,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  Utensils,
  X,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrders } from "./hooks/use-orders"
import type { CustomerOption, LiveOrder } from "./types"
import type { OrderStatus } from "@/lib/database/entities/entities/enums"
import {
  ReceiptTemplate,
  type ReceiptData,
  type ReceiptTemplateSettings,
} from "@/components/receipt/receipt-template"

type Filter = "active" | "pending" | "preparing" | "ready" | "served" | "history"
const filters: { id: Filter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served / Out for delivery" },
  { id: "history", label: "History" },
]
const statusLabel: Record<OrderStatus, string> = {
  pending: "New",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
}
function orderStatusLabel(order: LiveOrder, status: OrderStatus = order.status) {
  if (order.orderType !== "delivery") return statusLabel[status]
  if (status === "served") return "Out for delivery"
  if (status === "completed") return "Order received"
  return statusLabel[status]
}
const statusVariant: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  preparing: "default",
  ready: "secondary",
  served: "secondary",
  completed: "secondary",
  cancelled: "destructive",
}
const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value
  )
const orderTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value))

function matches(order: LiveOrder, filter: Filter) {
  if (filter === "active")
    return ["pending", "preparing", "ready", "served"].includes(order.status)
  if (filter === "pending" || filter === "preparing" || filter === "ready" || filter === "served")
    return order.status === filter
  if (filter === "history")
    return ["completed", "cancelled"].includes(order.status)
  return true
}

type MenuOption = {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string | null
}
type TableOption = { id: string; tableNumber: string; capacity: number }
type DraftLine = { menuItemId: string; quantity: number; notes: string }
type DiscountOption = {
  id: string
  name: string
  percentage: number
  requiresIdVerification: boolean
}
type PromotionOption = {
  id: string
  name: string
  promoType: "percentage" | "fixed_amount" | "buy_x_get_y"
  discountValue: number
  minSpend: number | null
  menuItemIds: string[]
  isAvailable: boolean
  unavailableReason: string | null
}
type PaymentConfirmationDraft = {
  orderId: string
  orderNumber: string
  paymentMethod: string
  customerPaymentReference: string | null
}
type PricingOptions = {
  vatEnabled: boolean
  vatRate: number
  vatInclusive: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
}
type ReceiptToPrint = { receipt: ReceiptData }

export function LiveOrdersBoard({
  orders: initialOrders,
  customers,
  discountsEnabled,
  paymentMethods,
  paymentQrImages,
  menuOptions,
  tables,
  discountOptions,
  promotionOptions,
  pricing,
  receiptSettings,
  basePath = "/admin",
}: {
  orders: LiveOrder[]
  customers: CustomerOption[]
  discountsEnabled: boolean
  paymentMethods: { id: string; label: string }[]
  paymentQrImages: {
    gcash: string | null
    maya: string | null
    qrph: string | null
  }
  menuOptions: MenuOption[]
  tables: TableOption[]
  discountOptions: DiscountOption[]
  promotionOptions: PromotionOption[]
  pricing: PricingOptions
  receiptSettings: ReceiptTemplateSettings
  basePath?: "/admin" | "/cashier"
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [filter, setFilter] = useState<Filter>(
    basePath === "/cashier" ? "pending" : "active"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draftLines, setDraftLines] = useState<DraftLine[]>([])
  const [formError, setFormError] = useState("")
  const [menuSearch, setMenuSearch] = useState("")
  const [menuCategory, setMenuCategory] = useState("All")
  const [selectedDiscountId, setSelectedDiscountId] = useState("")
  const [selectedPromotionId, setSelectedPromotionId] = useState("")
  const [paymentConfirmationDraft, setPaymentConfirmationDraft] =
    useState<PaymentConfirmationDraft | null>(null)
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("")
  const [paymentReferenceError, setPaymentReferenceError] = useState("")
  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptToPrint | null>(
    null
  )
  const [customerPaymentLinkToken, setCustomerPaymentLinkToken] = useState("")
  const [customerPaymentQr, setCustomerPaymentQr] = useState("")
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethods[0]?.id ?? ""
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, OrderStatus>
  >({})
  const { pending, moveOrder, createOrder, markPaymentReceived } = useOrders()
  useEffect(() => setOrders(initialOrders), [initialOrders])
  useEffect(() => {
    const socket = io(undefined, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: true,
    })
    socket.on("connect", () => setRealtimeConnected(true))
    socket.on("disconnect", () => setRealtimeConnected(false))
    socket.on("connect_error", () => setRealtimeConnected(false))
    socket.on("orders:changed", async ({ orderId }: { orderId: string }) => {
      try {
        const response = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}`,
          { cache: "no-store" }
        )
        if (response.status === 404) {
          setOrders((current) => current.filter((order) => order.id !== orderId))
          return
        }
        if (!response.ok) return
        const updatedOrder = (await response.json()) as LiveOrder
        setOrders((current) =>
          [updatedOrder, ...current.filter((order) => order.id !== orderId)].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      } catch {
        // Keep the current board usable if the snapshot request fails.
      }
    })
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [])
  const displayOrders = useMemo(
    () =>
      orders.map((order) => {
        const status = optimisticStatuses[order.id]
        return status ? { ...order, status } : order
      }),
    [orders, optimisticStatuses]
  )
  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return displayOrders.filter(
      (order) =>
        matches(order, filter) &&
        (!query ||
          [
            order.orderNumber,
            order.customerName,
            order.customerContact,
            order.tableNumber,
            ...order.items.map((item) => item.name),
          ].some((value) => value?.toLowerCase().includes(query)))
    )
  }, [displayOrders, filter, searchQuery])
  const activeCount = displayOrders.filter((order) =>
    matches(order, "active")
  ).length
  const newCount = displayOrders.filter(
    (order) => order.status === "pending"
  ).length
  const preparingCount = displayOrders.filter(
    (order) => order.status === "preparing"
  ).length
  const readyCount = displayOrders.filter((order) => order.status === "ready").length
  const servedCount = displayOrders.filter((order) => order.status === "served").length
  const visibleFilters =
    basePath === "/cashier"
      ? filters.filter((item) => item.id !== "active")
      : filters

  useEffect(() => {
    setOptimisticStatuses((current) => {
      let changed = false
      const next = { ...current }
      for (const order of orders) {
        if (next[order.id] === order.status) {
          delete next[order.id]
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [orders])

  useEffect(() => {
    if (!receiptToPrint) {
      document.body.classList.remove("live-order-printing")
      return
    }
    document.body.classList.add("live-order-printing")
    return () => {
      document.body.classList.remove("live-order-printing")
    }
  }, [receiptToPrint])

  useEffect(() => {
    if (!customerPaymentLinkToken) {
      setCustomerPaymentQr("")
      return
    }
    const link = `${window.location.origin}/customer/payment-reference/${customerPaymentLinkToken}`
    void QRCode.toDataURL(link, { width: 240, margin: 1 }).then(
      setCustomerPaymentQr
    )
  }, [customerPaymentLinkToken])

  function requestStatusChange(order: LiveOrder, status: OrderStatus) {
    const rollback = () => {
      setOptimisticStatuses((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
    }
    void moveOrder(
      order.id,
      order.orderNumber,
      status,
      () =>
        setOptimisticStatuses((current) => ({
          ...current,
          [order.id]: status,
        })),
      rollback
    )
  }

  function advance(order: LiveOrder) {
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      pending: "preparing",
      preparing: "ready",
      ready: "served",
      served: "completed",
    }
    const target = next[order.status]
    if (target) requestStatusChange(order, target)
  }

  async function submitNewOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    if (!draftLines.length || draftLines.some((line) => !line.menuItemId)) {
      setFormError("Add at least one menu item.")
      return
    }
    if (
      selectedDiscountId &&
      !String(
        new FormData(event.currentTarget).get("discountHolderName") ?? ""
      ).trim()
    ) {
      setFormError("Enter the discount holder name.")
      return
    }
    const selectedDiscount = discountOptions.find(
      (item) => item.id === selectedDiscountId
    )
    if (
      selectedDiscount?.requiresIdVerification &&
      !String(
        new FormData(event.currentTarget).get("discountIdNumber") ?? ""
      ).trim()
    ) {
      setFormError("Enter the required discount ID number.")
      return
    }
    const formData = new FormData(event.currentTarget)
    formData.set(
      "lines",
      JSON.stringify(
        draftLines.map((line) => ({
          ...line,
          quantity: Number(line.quantity),
          notes: line.notes || null,
        }))
      )
    )
    const result = await createOrder(formData)
    if (result.ok) {
      setCreateOpen(false)
      setDraftLines([])
      setSelectedCustomerId("")
      if (result.paymentReferenceToken)
        setCustomerPaymentLinkToken(result.paymentReferenceToken)
    } else setFormError(result.message)
  }

  async function submitPaymentConfirmation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    if (!paymentConfirmationDraft) return
    const referenceRequired = ["gcash", "maya", "qrph"].includes(
      paymentConfirmationDraft.paymentMethod
    )
    const referenceNumber = paymentReferenceNumber.trim()
    if (referenceRequired && !referenceNumber) {
      setPaymentReferenceError("Enter the payment reference number.")
      return
    }
    setPaymentReferenceError("")
    const paymentResult = await markPaymentReceived(
      paymentConfirmationDraft.orderId,
      referenceNumber
    )
    if (paymentResult.ok) {
      const paidOrder = orders.find(
        (order) => order.id === paymentConfirmationDraft.orderId
      )
      setPaymentConfirmationDraft(null)
      setPaymentReferenceNumber("")
      if (paidOrder) {
        setReceiptToPrint({
          receipt: createReceiptData(
            paidOrder,
            receiptSettings,
            paymentResult.receiptNumber ?? paidOrder.receiptNumber,
            paymentResult.paidAt ?? new Date().toISOString()
          ),
        })
      }
    }
  }

  const draftTotal = draftLines.reduce(
    (total, line) =>
      total +
      (menuOptions.find((menu) => menu.id === line.menuItemId)?.price ?? 0) *
        Number(line.quantity || 0),
    0
  )
  const selectedDiscount = discountOptions.find(
    (item) => item.id === selectedDiscountId
  )
  const selectedPromotion = promotionOptions.find(
    (item) => item.id === selectedPromotionId
  )
  const hasAvailablePromotion = promotionOptions.some(
    (item) => item.isAvailable
  )
  const promotionEligibleSubtotal = selectedPromotion?.menuItemIds.length
    ? draftLines
        .filter((line) =>
          selectedPromotion.menuItemIds.includes(line.menuItemId)
        )
        .reduce(
          (sum, line) =>
            sum +
            (menuOptions.find((menu) => menu.id === line.menuItemId)?.price ??
              0) *
              line.quantity,
          0
        )
    : draftTotal
  const discountEstimate = selectedDiscount
    ? (draftTotal * selectedDiscount.percentage) / 100
    : 0
  const promotionBase = Math.max(
    0,
    promotionEligibleSubtotal - discountEstimate
  )
  const promotionEstimate = selectedPromotion
    ? Math.min(
        promotionBase,
        selectedPromotion.promoType === "percentage"
          ? (promotionBase * selectedPromotion.discountValue) / 100
          : selectedPromotion.promoType === "fixed_amount"
            ? selectedPromotion.discountValue
            : 0
      )
    : 0
  const finalDiscountEstimate = Math.min(
    draftTotal,
    discountEstimate + promotionEstimate
  )
  const selectedPaymentQrImage =
    paymentMethod === "gcash" ||
    paymentMethod === "maya" ||
    paymentMethod === "qrph"
      ? paymentQrImages[paymentMethod]
      : null
  const discountedSubtotal = Math.max(0, draftTotal - finalDiscountEstimate)
  const taxEstimate = pricing.vatEnabled
    ? Math.round(
        (pricing.vatInclusive
          ? (discountedSubtotal * pricing.vatRate) / (100 + pricing.vatRate)
          : (discountedSubtotal * pricing.vatRate) / 100) * 100
      ) / 100
    : 0
  const serviceChargeEstimate = pricing.serviceChargeEnabled
    ? Math.round(
        ((discountedSubtotal * pricing.serviceChargeRate) / 100) * 100
      ) / 100
    : 0
  const totalEstimate =
    Math.round(
      (discountedSubtotal +
        serviceChargeEstimate +
        (pricing.vatEnabled && pricing.vatInclusive ? 0 : taxEstimate)) *
        100
    ) / 100
  const categories = [
    "All",
    ...new Set(menuOptions.map((menu) => menu.category)),
  ]
  const filteredMenu = menuOptions.filter(
    (menu) =>
      (menuCategory === "All" || menu.category === menuCategory) &&
      menu.name.toLowerCase().includes(menuSearch.toLowerCase())
  )
  function addMenuItem(menuItemId: string) {
    setDraftLines((lines) => {
      const existing = lines.find((line) => line.menuItemId === menuItemId)
      return existing
        ? lines.map((line) =>
            line.menuItemId === menuItemId
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        : [...lines, { menuItemId, quantity: 1, notes: "" }]
    })
  }
  function changeQuantity(menuItemId: string, delta: number) {
    setDraftLines((lines) =>
      lines
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0)
    )
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Orders</h1>
          <p className="text-sm text-muted-foreground">
            Review incoming orders and move them through kitchen service.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <span className={`size-2 rounded-full ${realtimeConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            {realtimeConnected ? "Live" : "Connecting"}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setFormError("")
              setDraftLines([])
              setSelectedDiscountId("")
              setSelectedPromotionId("")
              setCreateOpen(true)
            }}
            disabled={!menuOptions.length}
          >
            <Plus className="mr-1 size-4" />
            New order
          </Button>
        </div>
      </header>

      {/*  <div className="grid gap-3 sm:grid-cols-3">
      <Summary title="Active orders" value={activeCount} icon={Utensils} />
      <Summary title="New orders" value={newCount} icon={Clock3} highlight={newCount > 0} />
      <Summary title="Preparing" value={preparingCount} icon={ChefHat} />
    </div>
 */}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Filter orders"
          className="flex min-w-0 gap-1 overflow-x-auto"
        >
          {visibleFilters.map((item) => {
            const count =
              item.id === "history"
                ? undefined
                : item.id === "active"
                  ? activeCount
                  : item.id === "pending"
                    ? newCount
                    : item.id === "preparing"
                      ? preparingCount
                      : item.id === "ready"
                        ? readyCount
                        : item.id === "served"
                          ? servedCount
                          : displayOrders.length
            return (
              <button
                key={item.id}
                type="button"
                aria-current={filter === item.id ? "page" : undefined}
                onClick={() => setFilter(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${filter === item.id ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/70"}`}
              >
                {item.label}
                {count !== undefined ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search orders"
            placeholder="Search order, customer, table, item..."
            className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {visibleOrders.length ? (
        filter === "history" ? (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type / table</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerName || (order.orderType === "qr" ? "QR Guest" : "Walk-in customer")}</p>
                      {order.customerContact ? <p className="text-xs text-muted-foreground">{order.customerContact}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {order.orderType === "delivery" ? "Delivery order" : order.orderType === "qr" ? "QR order" : "Counter order"}{order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{orderTime(order.createdAt)}</td>
                    <td className="max-w-64 px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-2">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{peso(order.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {order.paymentStatus === "pending" ? order.orderType === "delivery" ? "Due on delivery" : "Awaiting payment" : order.paymentStatus.replaceAll("_", " ")}
                      {order.paymentMethod ? ` · ${order.orderType === "delivery" ? "COD" : order.paymentMethod === "qrph" ? "QRPH" : order.paymentMethod.toUpperCase()}` : ""}
                    </td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[order.status]}>{orderStatusLabel(order)}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {order.paymentStatus === "paid" ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => setReceiptToPrint({ receipt: createReceiptData(order, receiptSettings, order.receiptNumber, order.paidAt ?? order.createdAt) })}>
                          <ReceiptText className="mr-1 size-4" />Print
                        </Button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleOrders.map((order) => (
            <Card
              key={order.id}
              size="sm"
              className={`[--card-spacing:--spacing(3)] ${order.status === "pending" ? "border-amber-500/40" : ""}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-1">
                <div className="min-w-0">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {order.orderNumber}
                    <Badge variant={statusVariant[order.status]}>
                      {orderStatusLabel(order)}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {orderTime(order.createdAt)} ·{" "}
                    {order.orderType === "delivery" ? "Delivery order" : order.orderType === "qr" ? "QR order" : "Counter order"}
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">
                    {peso(order.total)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {order.paymentStatus === "pending"
                      ? order.orderType === "delivery" ? "due on delivery" : "awaiting payment"
                      : order.paymentStatus.replaceAll("_", " ")}
                    {order.paymentMethod
                      ? ` · ${order.orderType === "delivery" ? "COD" : order.paymentMethod === "qrph" ? "QRPH" : order.paymentMethod.toUpperCase()}`
                      : ""}
                    {order.paymentReference
                      ? ` · Ref ${order.paymentReference}`
                      : ""}
                  </p>
                  {order.paymentStatus === "pending" &&
                  order.customerPaymentReference ? (
                    <p className="mt-1 max-w-52 text-xs break-all text-muted-foreground">
                      Customer ref:{" "}
                      <span className="font-mono">
                        {order.customerPaymentReference}
                      </span>
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-sm">
                  <div>
                    <p className="font-medium">
                      {order.customerName ||
                        (order.orderType === "qr"
                          ? "QR Guest"
                          : "Walk-in customer")}
                    </p>
                    {order.customerContact ? (
                      <p className="text-xs text-muted-foreground">
                        {order.customerContact}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.items.length} line item
                    {order.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="max-h-36 divide-y overflow-y-auto rounded-md border px-2.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-1.5 first:pt-2 last:pb-2">
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span>
                          <span className="mr-2 inline-flex min-w-7 justify-center rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                            ×{item.quantity}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {peso(item.subtotal)}
                        </span>
                      </div>
                      {item.notes ? (
                        <p className="mt-1 pl-9 text-xs text-muted-foreground">
                          Note: {item.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2 border-t pt-2">
                  <div className="text-[11px] text-muted-foreground">
                    {order.statusHistory.length
                      ? `Updated: ${orderStatusLabel(order, order.statusHistory[order.statusHistory.length - 1].status as OrderStatus)}`
                      : "Awaiting staff action"}
                  </div>
                  <div className="flex min-w-0 flex-wrap justify-end gap-2">
                    {order.paymentStatus === "pending" && order.orderType !== "delivery" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setPaymentReferenceNumber("")
                          setPaymentReferenceError("")
                          setPaymentConfirmationDraft({
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            paymentMethod: order.paymentMethod ?? "cash",
                            customerPaymentReference:
                              order.customerPaymentReference,
                          })
                        }}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                    {order.paymentStatus === "paid" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReceiptToPrint({
                            receipt: createReceiptData(
                              order,
                              receiptSettings,
                              order.receiptNumber,
                              order.paidAt ?? order.createdAt
                            ),
                          })
                        }
                      >
                        <ReceiptText className="mr-1 size-4" />
                        Print receipt
                      </Button>
                    ) : null}
                    {["pending", "preparing", "ready"].includes(
                      order.status
                    ) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          requestStatusChange(order, "cancelled")
                        }
                      >
                        <XCircle className="mr-1 size-4" />
                        Cancel
                      </Button>
                    ) : null}
                    {order.status === "pending" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending || (order.paymentStatus !== "paid" && order.orderType !== "delivery")}
                        title={
                          order.paymentStatus !== "paid" && order.orderType !== "delivery"
                            ? "Confirm payment before starting this order."
                            : undefined
                        }
                        onClick={() => advance(order)}
                      >
                        <Check className="mr-1 size-4" />
                        Accept & start
                      </Button>
                    ) : null}
                    {order.status === "preparing" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => advance(order)}
                      >
                        Mark ready
                      </Button>
                    ) : null}
                    {order.status === "ready" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => advance(order)}
                      >
                        {order.orderType === "delivery" ? "Out for delivery" : "Mark served"}
                      </Button>
                    ) : null}
                    {order.status === "served" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending || (order.paymentStatus !== "paid" && order.orderType !== "delivery")}
                        title={
                          order.paymentStatus !== "paid" && order.orderType !== "delivery"
                            ? "Confirm payment before completing this order."
                            : undefined
                        }
                        onClick={() => advance(order)}
                      >
                        {order.orderType === "delivery" ? "Order received" : "Complete"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )
      ) : (
        <Card size="sm">
          <CardContent className="flex min-h-40 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-3">
              <RefreshCw className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-3 font-medium">
              {searchQuery
                ? "No matching orders"
                : `No ${filter === "active" ? "active" : `${filter} `}orders`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try another order number, customer, table, contact, or menu item."
                : "New orders will appear here as soon as they are placed."}
            </p>
          </CardContent>
        </Card>
      )}
      {createOpen ? (
        <div className="fixed inset-0 z-[90] bg-background">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-order-title"
            className="flex h-dvh w-full flex-col overflow-hidden bg-background"
          >
            <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 id="new-order-title" className="text-lg font-semibold">
                  New POS order
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select menu items, then review the cart and create the order.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setCreateOpen(false)}
                disabled={pending}
              >
                <X className="size-5" />
              </button>
            </header>
            <form
              className="grid min-h-0 flex-1 grid-rows-[minmax(0,0.42fr)_minmax(0,0.3fr)_minmax(0,0.28fr)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px_360px] lg:grid-rows-1"
              onSubmit={(event) => void submitNewOrder(event)}
            >
              <div className="flex min-h-0 flex-col border-b p-4 lg:border-r lg:border-b-0 lg:p-5">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                    className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm"
                    placeholder="Search menu items..."
                    aria-label="Search menu items"
                  />
                </div>
                <nav
                  className="my-3 flex gap-1 overflow-x-auto"
                  aria-label="Menu categories"
                >
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => setMenuCategory(category)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${menuCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredMenu.map((menu) => (
                      <button
                        type="button"
                        key={menu.id}
                        onClick={() => addMenuItem(menu.id)}
                        className="group overflow-hidden rounded-lg border text-left transition hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div className="h-20 w-full overflow-hidden bg-muted">
                          {menu.imageUrl ? (
                            <img
                              src={menu.imageUrl}
                              alt={menu.name}
                              className="size-full object-cover transition group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="grid size-full place-items-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <span className="block p-3">
                          <span className="line-clamp-2 block text-sm font-medium">
                            {menu.name}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {menu.category}
                          </span>
                          <span className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold tabular-nums">
                              {peso(menu.price)}
                            </span>
                            <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                              <Plus className="size-4" />
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {!filteredMenu.length ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No menu items match this search.
                    </p>
                  ) : null}
                </div>
              </div>
              <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="font-semibold">Current order</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                    {draftLines.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                    items
                  </span>
                </div>
                <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain p-3">
                  {draftLines.map((line) => {
                    const menu = menuOptions.find(
                      (option) => option.id === line.menuItemId
                    )
                    if (!menu) return null
                    return (
                      <div
                        key={line.menuItemId}
                        className="border-b pb-2 last:border-0"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate font-medium">
                            {menu.name}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {peso(menu.price * line.quantity)}
                          </span>
                        </div>
                        <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                          <div className="inline-flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease ${menu.name}`}
                              onClick={() => changeQuantity(menu.id, -1)}
                              className="grid size-7 place-items-center rounded border hover:bg-muted"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-sm tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${menu.name}`}
                              onClick={() => changeQuantity(menu.id, 1)}
                              className="grid size-7 place-items-center rounded border hover:bg-muted"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <input
                            aria-label={`Note for ${menu.name}`}
                            maxLength={255}
                            value={line.notes}
                            onChange={(event) =>
                              setDraftLines((lines) =>
                                lines.map((item) =>
                                  item.menuItemId === menu.id
                                    ? { ...item, notes: event.target.value }
                                    : item
                                )
                              )
                            }
                            className="h-7 w-28 rounded border bg-background px-2 text-xs sm:w-36"
                            placeholder="Add note"
                          />
                        </div>
                      </div>
                    )
                  })}
                  {!draftLines.length ? (
                    <div className="flex h-full min-h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                      <Utensils className="mb-2 size-5" />
                      Tap a menu item to add it
                    </div>
                  ) : null}
                </div>
              </aside>
              <aside className="flex min-h-0 flex-col overflow-y-auto border-l">
                <div className="shrink-0 border-b px-4 py-3">
                  <h3 className="font-semibold">Checkout summary</h3>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 border-b p-3">
                  <label className="grid gap-1 text-[11px] font-medium text-muted-foreground">
                    ORDER TYPE
                    <select
                      name="orderType"
                      className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                      defaultValue="counter"
                    >
                      <option value="counter">Counter</option>
                      <option value="qr">Dine-in / QR</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-[11px] font-medium text-muted-foreground">
                    TABLE
                    <select
                      name="tableId"
                      className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                      defaultValue=""
                    >
                      <option value="">No table</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.tableNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="col-span-2 grid gap-1 text-[11px] font-medium text-muted-foreground">
                    CUSTOMER
                    <select
                      name="customerId"
                      value={selectedCustomerId}
                      onChange={(event) =>
                        setSelectedCustomerId(event.target.value)
                      }
                      className="h-9 rounded-md border bg-background px-2 text-sm font-normal text-foreground"
                    >
                      <option value="">Walk-in / new customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.contactNumber
                            ? ` · ${customer.contactNumber}`
                            : ""}{" "}
                          · {customer.pointsBalance} pts
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedCustomerId ? (
                    <p className="col-span-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
                      The order will be linked to this customer and earn points
                      after completion.
                    </p>
                  ) : (
                    <>
                      <input
                        name="customerName"
                        maxLength={100}
                        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                        placeholder="Customer name (optional)"
                      />
                      <input
                        name="customerContact"
                        maxLength={20}
                        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                        placeholder="Contact number (optional)"
                      />
                    </>
                  )}
                  <fieldset className="col-span-2 grid gap-1">
                    <legend className="text-[11px] font-medium text-muted-foreground">
                      PAYMENT METHOD
                    </legend>
                    <input
                      type="hidden"
                      name="paymentMethod"
                      value={paymentMethod}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          aria-pressed={paymentMethod === method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`min-h-10 rounded-md border px-2 text-sm font-medium transition-colors ${
                            paymentMethod === method.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                    {paymentMethod !== "cash" ? (
                      <div className="mt-2 rounded-md border p-3">
                        {selectedPaymentQrImage ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedPaymentQrImage}
                              alt={`${paymentMethods.find((method) => method.id === paymentMethod)?.label ?? "Payment"} QR code`}
                              className="size-28 rounded-md object-contain"
                            />
                            <p className="text-xs text-muted-foreground">
                              Ipa-scan sa customer. I-verify ang payment sa
                              provider app bago ito markahang paid.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Walang naka-save na QR image para sa method na ito.
                            I-set ito sa System Settings → Payments.
                          </p>
                        )}
                      </div>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground">
                      Manage available methods in System Settings.
                    </p>
                  </fieldset>
                </div>
                <div className="shrink-0 space-y-2 border-b p-3">
                  <label className="grid gap-1 text-[11px] font-medium text-muted-foreground">
                    DISCOUNT
                    <select
                      name="discountTypeId"
                      value={selectedDiscountId}
                      onChange={(event) =>
                        setSelectedDiscountId(event.target.value)
                      }
                      className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                    >
                      <option value="">No discount</option>
                      {discountOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.percentage}%
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedDiscount ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="discountHolderName"
                        maxLength={100}
                        required
                        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                        placeholder="Discount holder name"
                      />
                      <input
                        name="discountIdNumber"
                        maxLength={50}
                        required={selectedDiscount.requiresIdVerification}
                        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                        placeholder={
                          selectedDiscount.requiresIdVerification
                            ? "ID number (required)"
                            : "ID number (optional)"
                        }
                      />
                    </div>
                  ) : discountOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {discountsEnabled
                        ? "No active discount types. "
                        : "Discounts are disabled in System Settings. "}
                      {basePath === "/admin" ? (
                        <Link
                          href="/admin/discounts"
                          className="underline underline-offset-2"
                        >
                          Manage discounts
                        </Link>
                      ) : null}
                      {!discountsEnabled ? (
                        <>
                          {" "}
                          or{" "}
                          {basePath === "/admin" ? (
                            <Link
                              href="/admin/settings"
                              className="underline underline-offset-2"
                            >
                              enable them in Settings
                            </Link>
                          ) : (
                            "ask an administrator to enable them"
                          )}
                          .
                        </>
                      ) : (
                        " to make them available here."
                      )}
                    </p>
                  ) : null}
                  <label className="grid gap-1 text-[11px] font-medium text-muted-foreground">
                    PROMOTION
                    <select
                      name="promotionId"
                      value={selectedPromotionId}
                      onChange={(event) =>
                        setSelectedPromotionId(event.target.value)
                      }
                      disabled={!promotionOptions.length}
                      className="h-9 rounded-md border bg-background px-2 text-sm text-foreground disabled:opacity-70"
                    >
                      <option value="">
                        {hasAvailablePromotion
                          ? "No promotion"
                          : promotionOptions.length
                            ? "No active promotions right now"
                            : "No promotions configured"}
                      </option>
                      {promotionOptions.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={
                            !item.isAvailable ||
                            (item.minSpend !== null &&
                              draftTotal < item.minSpend) ||
                            (item.menuItemIds.length > 0 &&
                              !draftLines.some((line) =>
                                item.menuItemIds.includes(line.menuItemId)
                              ))
                          }
                        >
                          {item.name}
                          {item.unavailableReason
                            ? ` · ${item.unavailableReason}`
                            : ""}
                          {item.promoType === "percentage"
                            ? ` · ${item.discountValue}% off`
                            : item.promoType === "fixed_amount"
                              ? ` · ₱${item.discountValue.toFixed(2)} off`
                              : ""}
                          {item.minSpend
                            ? ` · min ₱${item.minSpend.toFixed(2)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {!hasAvailablePromotion ? (
                      <span className="font-normal text-muted-foreground normal-case">
                        {basePath === "/admin" ? (
                          <Link
                            href="/admin/discounts"
                            className="underline underline-offset-2"
                          >
                            Manage promotions
                          </Link>
                        ) : (
                          "No active promotions right now."
                        )}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="shrink-0 space-y-2 border-t p-3 sm:p-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{peso(draftTotal)}</span>
                  </div>
                  {finalDiscountEstimate > 0 ? (
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>Discounts</span>
                      <span className="tabular-nums">
                        −{peso(finalDiscountEstimate)}
                      </span>
                    </div>
                  ) : null}
                  {pricing.serviceChargeEnabled ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Service charge
                      </span>
                      <span className="tabular-nums">
                        {peso(serviceChargeEstimate)}
                      </span>
                    </div>
                  ) : null}
                  {pricing.vatEnabled ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        VAT {pricing.vatInclusive ? "(included)" : ""}
                      </span>
                      <span className="tabular-nums">{peso(taxEstimate)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{peso(totalEstimate)}</span>
                  </div>
                  {formError ? (
                    <p role="alert" className="text-xs text-destructive">
                      {formError}
                    </p>
                  ) : null}
                  <div className="grid min-w-0 grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-0 whitespace-nowrap"
                      onClick={() => setCreateOpen(false)}
                      disabled={pending}
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      className="min-w-0 whitespace-nowrap"
                      disabled={pending || !draftLines.length}
                    >
                      {pending ? "Saving…" : "Create order"}
                    </Button>
                  </div>
                </div>
              </aside>
              <input
                type="hidden"
                name="lines"
                value={JSON.stringify(
                  draftLines.map((line) => ({
                    ...line,
                    notes: line.notes || null,
                  }))
                )}
              />
            </form>
          </section>
        </div>
      ) : null}
      {receiptToPrint ? (
        <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/60 p-3 print:block print:overflow-visible print:bg-white print:p-0">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-order-receipt-title"
            className="w-full max-w-md rounded-xl border bg-background p-4 shadow-2xl print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none"
          >
            <header className="mb-3 flex items-center justify-between gap-3 print:hidden">
              <div>
                <h2 id="live-order-receipt-title" className="font-semibold">
                  Customer receipt
                </h2>
                <p className="text-xs text-muted-foreground">
                  {receiptToPrint.receipt.receiptNumber}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReceiptToPrint(null)}
              >
                Close
              </Button>
            </header>
            <div className="live-order-print mx-auto max-h-[65dvh] overflow-y-auto rounded-lg border bg-white sm:max-h-[72dvh] print:max-h-none print:overflow-visible print:rounded-none print:border-0">
              <ReceiptTemplate
                settings={receiptSettings}
                receipt={receiptToPrint.receipt}
              />
            </div>
            <footer className="mt-3 flex justify-end gap-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiptToPrint(null)}
              >
                Done
              </Button>
              <Button type="button" onClick={() => window.print()}>
                <ReceiptText className="mr-1 size-4" />
                Print receipt
              </Button>
            </footer>
          </section>
        </div>
      ) : null}

      {paymentConfirmationDraft ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-confirmation-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl"
          >
            <h2
              id="payment-confirmation-title"
              className="text-lg font-semibold"
            >
              Verify payment for {paymentConfirmationDraft.orderNumber}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm the payment in the provider app before continuing. This
              form records your verification; it does not check the provider
              automatically.
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={submitPaymentConfirmation}
            >
              {["gcash", "maya", "qrph"].includes(
                paymentConfirmationDraft.paymentMethod
              ) ? (
                <>
                  <div className="grid gap-1.5 rounded-md border bg-muted/30 p-3 text-sm">
                    <span className="font-medium">
                      Customer-submitted reference
                    </span>
                    <span className="font-mono break-all">
                      {paymentConfirmationDraft.customerPaymentReference ||
                        "Not submitted yet"}
                    </span>
                  </div>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium">
                      Reference verified in payment app
                    </span>
                    <input
                      autoFocus
                      required
                      maxLength={100}
                      value={paymentReferenceNumber}
                      onChange={(event) =>
                        setPaymentReferenceNumber(event.target.value)
                      }
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      placeholder="Enter the reference shown in GCash / Maya"
                    />
                  </label>
                </>
              ) : null}
              {paymentReferenceError ? (
                <p role="alert" className="text-sm text-destructive">
                  {paymentReferenceError}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setPaymentConfirmationDraft(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Verify & mark paid"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {customerPaymentLinkToken ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-payment-link-title"
            className="w-full max-w-sm rounded-xl border bg-background p-5 text-center shadow-xl"
          >
            <h2
              id="customer-payment-link-title"
              className="text-lg font-semibold"
            >
              Customer reference link
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              I-scan ng customer pagkatapos magbayad para maisumite ang
              transaction reference.
            </p>
            {customerPaymentQr ? (
              <img
                src={customerPaymentQr}
                alt="QR code for customer payment reference submission"
                className="mx-auto my-4 size-60 rounded border p-2"
              />
            ) : (
              <div className="mx-auto my-4 size-60 animate-pulse rounded bg-muted" />
            )}
            <Link
              href={`/customer/payment-reference/${customerPaymentLinkToken}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm break-all text-primary underline underline-offset-4"
            >
              {`/customer/payment-reference/${customerPaymentLinkToken}`}
            </Link>
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={() => setCustomerPaymentLinkToken("")}
              >
                Done
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function createReceiptData(
  order: LiveOrder,
  settings: ReceiptTemplateSettings,
  receiptNumber: string | null | undefined,
  paidAt: string
): ReceiptData {
  const taxableSubtotal = Math.max(0, order.subtotal - order.discount)
  const serviceCharge = Math.max(
    0,
    order.total -
      taxableSubtotal -
      (settings.vatEnabled && !settings.vatInclusive ? order.tax : 0)
  )

  return {
    receiptNumber: receiptNumber ?? order.orderNumber,
    date: new Date(paidAt),
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    paymentMethod: order.paymentMethod ?? "Paid",
    cashier: "PRIME POS",
    totals: {
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      serviceCharge,
      total: order.total,
    },
  }
}

function Summary({
  title,
  value,
  icon: Icon,
  highlight = false,
}: {
  title: string
  value: number
  icon: typeof Clock3
  highlight?: boolean
}) {
  return (
    <Card size="sm" className="[--card-spacing:--spacing(2)]">
      <CardContent className="flex min-h-0 items-center justify-between p-3">
        <div className="flex items-baseline gap-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p
            className={`text-lg font-semibold tabular-nums ${highlight ? "text-amber-600" : ""}`}
          >
            {value}
          </p>
        </div>
        <div className="rounded-md bg-muted p-1.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
