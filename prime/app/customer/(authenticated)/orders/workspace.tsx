"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Bell, ChefHat, CircleCheck, CircleX, Clock3, FileText, RefreshCw, Utensils, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCustomerDigitalReceipt, submitCustomerCancellationRequest } from "@/app/customer/actions"
import { ReceiptTemplate, type ReceiptData, type ReceiptTemplateSettings } from "@/components/receipt/receipt-template"
import { RemoveOrderButton } from "./remove-order-button"

type DigitalReceipt = { settings: ReceiptTemplateSettings; receipt: Omit<ReceiptData, "date"> & { date: string } }
const statusTabs = [
  { key: "pending", label: "Pending", icon: Clock3 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Bell },
  { key: "served", label: "Served", icon: Utensils },
  { key: "completed", label: "Completed", icon: CircleCheck },
  { key: "cancelled", label: "Cancelled", icon: CircleX },
] as const

type OrderRow = {
  id: string
  orderNumber: string
  orderType: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  total: number
  discount: number
  createdAt: string
  paymentReferenceToken: string | null
  receiptAvailable: boolean
  receiptNumber: string | null
  pendingCancellation: boolean
  voidStatus: string | null
  items: {
    id: string
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
    notes: string | null
  }[]
}
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value
  )

export function CustomerOrders({ orders }: { orders: OrderRow[] }) {
  const router = useRouter()
  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null)
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()
  const [refreshPending, startRefresh] = useTransition()
  const [receiptOrder, setReceiptOrder] = useState<OrderRow | null>(null)
  const [receipt, setReceipt] = useState<DigitalReceipt | null>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const visibleOrders = orders.filter((order) => order.status === statusFilter)

  useEffect(() => {
    if (!receiptOrder) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReceiptOrder(null)
        setReceipt(null)
      }
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [receiptOrder])

  async function openReceipt(order: OrderRow) {
    setReceiptOrder(order)
    setReceipt(null)
    setReceiptError("")
    setReceiptLoading(true)
    try {
      const result = await getCustomerDigitalReceipt(order.id)
      if (!result) setReceiptError("This receipt is unavailable. Refresh your order history and try again.")
      else setReceipt(result as DigitalReceipt)
    } catch {
      setReceiptError("Could not load the receipt. Please try again.")
    } finally {
      setReceiptLoading(false)
    }
  }

  function submitCancellation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cancelOrder) return
    setMessage("")
    startTransition(async () => {
      const result = await submitCustomerCancellationRequest(
        cancelOrder.id,
        reason
      )
      setMessage(result.message)
      if (result.ok) {
        setCancelOrder(null)
        setReason("")
        window.location.reload()
      }
    })
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm text-muted-foreground">Your account</p>
          <h1 className="text-2xl font-semibold tracking-tight">Order history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track orders, submit payment references, request eligible
            cancellations, and open digital receipts.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={refreshPending} onClick={() => startRefresh(() => router.refresh())}>
          <RefreshCw className={`mr-1 size-4 ${refreshPending ? "animate-spin" : ""}`} />
          {refreshPending ? "Refreshing…" : "Refresh"}
        </Button>
      </header>
      {orders.length ? (
        <>
        <div role="group" aria-label="Filter orders by status" className="grid grid-cols-6 gap-0.5 print:hidden sm:gap-1">
          {statusTabs.map((tab) => {
            const count = orders.filter((order) => order.status === tab.key).length
            const active = statusFilter === tab.key
            return <button key={tab.key} type="button" aria-label={`${tab.label} orders, ${count}`} title={tab.label} aria-pressed={active} onClick={() => setStatusFilter(tab.key)} className={`relative flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0 rounded-lg border p-0.5 text-[8px] leading-none font-medium transition-colors sm:min-h-14 sm:gap-0.5 sm:rounded-xl sm:text-xs ${active ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}><tab.icon className="size-3.5 shrink-0 sm:size-[18px]" /><span className="max-w-full truncate whitespace-nowrap leading-tight">{tab.label}</span><span className={`absolute top-0 right-0 min-w-3 rounded-full px-0.5 text-[8px] leading-3 tabular-nums sm:top-0.5 sm:right-0.5 sm:min-w-4 sm:px-1 sm:text-[9px] sm:leading-4 ${active ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>{count}</span></button>
          })}
        </div>
        {visibleOrders.length ? (
        <div className="space-y-3 print:hidden">
          {visibleOrders.map((order) => (
            <Card key={order.id} size="sm">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{order.orderNumber}</h2>
                      <Badge
                        variant={
                          order.status === "cancelled"
                            ? "destructive"
                            : order.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                      {order.pendingCancellation ? (
                        <Badge variant="outline">Cancellation requested</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      }).format(new Date(order.createdAt))}{" "}
                      · {order.orderType === "qr" ? "Dine-in" : "Pickup"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {money(order.total)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.paymentStatus.replaceAll("_", " ")}
                      {order.paymentMethod
                        ? ` · ${order.paymentMethod.toUpperCase()}`
                        : ""}
                    </p>
                  </div>
                </header>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="divide-y rounded-md border px-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-3 py-2 text-sm"
                      >
                        <span>
                          {item.quantity} × {item.name}
                          {item.notes ? (
                            <span className="block text-xs text-muted-foreground">
                              {item.notes}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {money(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-start gap-2 md:justify-end">
                    {order.paymentStatus === "pending" &&
                    order.paymentReferenceToken ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/customer/payment-reference/${order.paymentReferenceToken}`}
                        >
                          <FileText className="size-4" />
                          Submit payment reference
                        </Link>
                      </Button>
                    ) : null}
                    {order.receiptAvailable ? (
                      <Button size="sm" variant="outline" onClick={() => void openReceipt(order)}>
                          <FileText className="size-4" />
                          Digital receipt
                      </Button>
                    ) : null}
                    {order.status === "pending" &&
                    !order.pendingCancellation ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCancelOrder(order)
                          setMessage("")
                        }}
                      >
                        <X className="size-4" />
                        Request cancellation
                      </Button>
                    ) : null}
                    {order.status === "completed" || order.status === "cancelled" ? (
                      <RemoveOrderButton
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                      />
                    ) : null}
                  </div>
                </div>
                {order.voidStatus && order.status === "pending" ? (
                  <p className="text-xs text-muted-foreground">
                    Cancellation request: {order.voidStatus}. The restaurant
                    will update this order after review.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
          <Card className="print:hidden"><CardContent className="p-8 text-center"><p className="font-medium">No {statusTabs.find((tab) => tab.key === statusFilter)?.label.toLowerCase()} orders</p><p className="mt-1 text-sm text-muted-foreground">Choose another status to view matching orders.</p></CardContent></Card>
        )}
        </>
      ) : (
        <Card className="print:hidden">
          <CardContent className="grid justify-items-center gap-2 p-10 text-center">
            <p className="font-semibold">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Your order history and receipts will appear here.
            </p>
            <Button asChild className="mt-2">
              <Link href="/customer/kiosk">Browse menu</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {cancelOrder ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 print:hidden">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="cancel-title" className="text-lg font-semibold">
                Request cancellation
              </h2>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close"
                disabled={pending}
                onClick={() => setCancelOrder(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {cancelOrder.orderNumber} can be cancelled only before it starts
              preparing. The restaurant may review the request.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={submitCancellation}>
              <label className="grid gap-1.5 text-sm font-medium">
                Reason
                <textarea
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="Tell us why you need to cancel"
                />
              </label>
              {message ? (
                <p role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setCancelOrder(null)}
                >
                  Keep order
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={pending || reason.trim().length < 3}
                >
                  {pending ? "Sending…" : "Send request"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {receiptOrder ? (
        <div onClick={() => { setReceiptOrder(null); setReceipt(null) }} className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-2 sm:p-4 print:static print:block print:bg-white print:p-0">
          <section onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-xl border bg-background shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
            <div className="flex items-center justify-between gap-3 border-b p-3 sm:p-4 print:hidden">
              <div className="min-w-0"><h2 id="receipt-title" className="font-semibold">Digital receipt</h2><p className="truncate text-xs text-muted-foreground">{receiptOrder.orderNumber}</p></div>
              <Button type="button" size="icon" variant="ghost" aria-label="Close receipt" onClick={() => { setReceiptOrder(null); setReceipt(null) }}><X className="size-4" /></Button>
            </div>
            <div className={`overflow-y-auto print:overflow-visible print:p-0 ${receipt ? "p-0" : "p-3 sm:p-5"}`}>
              {receiptLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading receipt…</p> : receiptError ? <p role="alert" className="py-8 text-center text-sm text-destructive">{receiptError}</p> : receipt ? <ReceiptTemplate embedded settings={receipt.settings} receipt={{ ...receipt.receipt, date: new Date(receipt.receipt.date) }} /> : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
