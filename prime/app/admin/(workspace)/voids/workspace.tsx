"use client"

import { useMemo, useState } from "react"
import { FileX, History, Plus, Search, ShieldCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useVoids } from "./hooks/use-voids"
import type {
  CancelledOrderRow,
  VoidableOrderOption,
  VoidRequestRow,
} from "./types"
import type { VoidStatus } from "@/lib/database/entities/entities/enums"

type Tab = "pending" | "resolved" | "cancellations" | "all"
type ResolveDraft = { id: string; status: "approved" | "rejected" } | null
const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
const statusText: Record<VoidStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
}
const statusVariant: Record<
  VoidStatus,
  "outline" | "secondary" | "destructive"
> = { pending: "outline", approved: "secondary", rejected: "destructive" }

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value))
}
function money(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value)
}

export function VoidCancellationWorkspace({
  voids,
  cancellations,
  orders,
}: {
  voids: VoidRequestRow[]
  cancellations: CancelledOrderRow[]
  orders: VoidableOrderOption[]
}) {
  const [tab, setTab] = useState<Tab>("pending")
  const [query, setQuery] = useState("")
  const [requestOpen, setRequestOpen] = useState(false)
  const [resolveDraft, setResolveDraft] = useState<ResolveDraft>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const { pending, request, resolve } = useVoids()
  const pendingVoids = voids.filter((item) => item.status === "pending")
  const settledVoids = voids.filter((item) => item.status !== "pending")
  const filteredVoids = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return voids.filter((item) => {
      const filterMatch =
        tab === "all" ||
        (tab === "pending" && item.status === "pending") ||
        (tab === "resolved" && item.status !== "pending")
      const searchMatch =
        !needle ||
        [
          item.orderNumber,
          item.customerName,
          item.tableNumber,
          item.reason,
          item.status,
        ].some((value) => value?.toLowerCase().includes(needle))
      return filterMatch && searchMatch
    })
  }, [voids, query, tab])
  const filteredCancellations = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cancellations.filter(
      (item) =>
        !needle ||
        [
          item.orderNumber,
          item.customerName,
          item.tableNumber,
          item.reason,
        ].some((value) => value?.toLowerCase().includes(needle))
    )
  }, [cancellations, query])

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await request(new FormData(event.currentTarget))
    if (result.ok) setRequestOpen(false)
  }

  async function submitResolution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resolveDraft) return
    const current = resolveDraft
    setResolveDraft(null)
    setResolutionNotes("")
    await resolve(current.id, current.status, resolutionNotes)
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Void / Cancellation Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Review void approvals and audit order cancellations.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setRequestOpen(true)}
          disabled={!orders.length}
        >
          <Plus className="mr-1 size-4" />
          Request order void
        </Button>
      </header>
      <div className="grid grid-cols-3 gap-3">
        <Summary
          label="Pending void approvals"
          value={pendingVoids.length}
          tone="amber"
        />
        <Summary
          label="Resolved void requests"
          value={settledVoids.length}
          tone="slate"
        />
        <Summary
          label="Cancelled orders logged"
          value={cancellations.length}
          tone="red"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1"
          aria-label="Void and cancellation log filters"
        >
          <TabButton
            active={tab === "pending"}
            onClick={() => setTab("pending")}
          >
            Pending <Count>{pendingVoids.length}</Count>
          </TabButton>
          <TabButton
            active={tab === "resolved"}
            onClick={() => setTab("resolved")}
          >
            Resolved
          </TabButton>
          <TabButton
            active={tab === "cancellations"}
            onClick={() => setTab("cancellations")}
          >
            Cancellations <Count>{cancellations.length}</Count>
          </TabButton>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            All void requests
          </TabButton>
        </nav>
        <label className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search void and cancellation logs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, guest, reason..."
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>

      {tab === "cancellations" ? (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Guest / table</th>
                  <th className="px-4 py-3 font-medium">Cancelled at</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Order total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCancellations.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">
                      {item.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      {item.customerName ?? "Walk-in customer"}
                      <p className="text-xs text-muted-foreground">
                        {item.tableNumber
                          ? `Table ${item.tableNumber}`
                          : "Counter order"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{dateTime(item.cancelledAt)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.source === "approved_void"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.source === "approved_void"
                          ? "Approved void"
                          : "Order cancellation"}
                      </Badge>
                    </td>
                    <td className="max-w-64 px-4 py-3 text-muted-foreground">
                      {item.reason ??
                        "No cancellation reason is stored in OrderStatusHistory."}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {money(item.total)}
                    </td>
                  </tr>
                ))}
                {!filteredCancellations.length ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      <Empty
                        icon="history"
                        title="No cancelled orders"
                        description="Order status history entries marked cancelled will appear here."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Requested at</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Resolution</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVoids.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.customerName ?? "Walk-in"}
                        {item.tableNumber
                          ? ` · Table ${item.tableNumber}`
                          : ""}{" "}
                        · {money(item.total)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Order status:{" "}
                        <span className="capitalize">{item.orderStatus}</span>
                      </p>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="whitespace-pre-wrap">{item.reason}</p>
                      {item.requestedByName ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Requested by {item.requestedByName}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {dateTime(item.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[item.status]}>
                        {statusText[item.status]}
                      </Badge>
                      {item.resolvedAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTime(item.resolvedAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-56 px-4 py-3 text-muted-foreground">
                      {item.resolutionNotes ??
                        (item.approvedByName
                          ? `Resolved by ${item.approvedByName}`
                          : "—")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {item.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => {
                                setResolutionNotes("")
                                setResolveDraft({
                                  id: item.id,
                                  status: "approved",
                                })
                              }}
                            >
                              <ShieldCheck className="mr-1 size-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => {
                                setResolutionNotes("")
                                setResolveDraft({
                                  id: item.id,
                                  status: "rejected",
                                })
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredVoids.length ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      <Empty
                        icon="void"
                        title={
                          tab === "pending"
                            ? "No pending void requests"
                            : "No void requests found"
                        }
                        description={
                          tab === "pending"
                            ? "New requests submitted with manager approval enabled will show here."
                            : "Try another search or submit a new void request."
                        }
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {requestOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending)
              setRequestOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="void-request-title"
            className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"
          >
            <header className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="void-request-title" className="text-lg font-semibold">
                  Request order void
                </h2>
                <p className="text-sm text-muted-foreground">
                  The system setting controls whether manager approval is
                  required.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setRequestOpen(false)}
                disabled={pending}
              >
                <X className="size-5" />
              </button>
            </header>
            <form className="space-y-3" onSubmit={submitRequest}>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Order</span>
                <select
                  name="orderId"
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select an order
                  </option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} · {order.status} ·{" "}
                      {order.customerName ?? "Walk-in"} · {money(order.total)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Reason for void</span>
                <textarea
                  name="reason"
                  required
                  minLength={3}
                  maxLength={5000}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Explain why the order should be voided."
                />
              </label>
              <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs text-muted-foreground">
                Approving a void marks the order cancelled and adds a
                cancellation history entry. A voided completed order does not
                add stock back. Payment records are retained; refunds are not
                handled by the current database workflow.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Submitting…" : "Submit request"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {resolveDraft ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending)
              setResolveDraft(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-void-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
          >
            <header className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="resolve-void-title" className="text-lg font-semibold">
                  {resolveDraft.status === "approved"
                    ? "Approve void request"
                    : "Reject void request"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add an optional note to the audit record.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setResolveDraft(null)}
              >
                <X className="size-5" />
              </button>
            </header>
            <form className="space-y-3" onSubmit={submitResolution}>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Resolution notes</span>
                <textarea
                  value={resolutionNotes}
                  onChange={(event) => setResolutionNotes(event.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Optional note"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolveDraft(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={
                    resolveDraft.status === "rejected"
                      ? "destructive"
                      : "default"
                  }
                  disabled={pending}
                >
                  {resolveDraft.status === "approved"
                    ? "Approve void"
                    : "Reject void"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${active ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}
function Count({ children }: { children: number }) {
  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
      {children}
    </span>
  )
}
function Empty({
  icon,
  title,
  description,
}: {
  icon: "history" | "void"
  title: string
  description: string
}) {
  return (
    <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
      {icon === "history" ? (
        <History className="size-7 text-muted-foreground" />
      ) : (
        <FileX className="size-7 text-muted-foreground" />
      )}
      <h2 className="mt-3 font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </CardContent>
  )
}
function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "amber" | "slate" | "red"
}) {
  const color =
    tone === "amber"
      ? "text-amber-700"
      : tone === "red"
        ? "text-destructive"
        : "text-muted-foreground"
  return (
    <Card size="sm" className="[--card-spacing:--spacing(1)]">
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-base font-semibold tabular-nums ${color}`}>
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
