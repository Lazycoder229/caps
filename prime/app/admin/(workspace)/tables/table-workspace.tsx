"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  ExternalLink,
  Plus,
  QrCode,
  Table2,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  deleteRestaurantTable,
  saveRestaurantTable,
  setRestaurantTableStatus,
} from "./actions"

type TableRow = {
  id: string
  tableNumber: string
  capacity: number
  qrCodeUrl: string | null
  status: "available" | "occupied" | "reserved"
  activeOrderNumber: string | null
}
type Reply = { ok: boolean; message: string }
type EditingTable = Pick<
  TableRow,
  "id" | "tableNumber" | "capacity" | "qrCodeUrl"
> | null

export function TableWorkspace({ tables }: { tables: TableRow[] }) {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [editing, setEditing] = useState<EditingTable>(null)
  const [busy, startTransition] = useTransition()
  const available = tables.filter(
    (table) => table.status === "available"
  ).length
  const occupied = tables.filter((table) => table.status === "occupied").length
  const reserved = tables.filter((table) => table.status === "reserved").length

  function run(action: (data: FormData) => Promise<Reply>, data: FormData) {
    startTransition(async () => {
      try {
        const result = await action(data)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) {
          setEditing(null)
          router.refresh()
        }
      } catch {
        toast("error", "Something went wrong", "Try again.")
      }
    })
  }

  async function changeStatus(
    table: TableRow,
    status: "available" | "reserved"
  ) {
    const data = new FormData()
    data.set("id", table.id)
    data.set("status", status)
    run(setRestaurantTableStatus, data)
  }

  async function remove(table: TableRow) {
    const approved = await confirm({
      title: "Delete this table?",
      description: `Delete Table ${table.tableNumber}? Tables with order history or reservations cannot be deleted.`,
      confirmLabel: "Delete table",
      destructive: true,
    })
    if (!approved) return
    const data = new FormData()
    data.set("id", table.id)
    run(deleteRestaurantTable, data)
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            QR / Table Setup
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage table capacity, QR links, and live table status.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setEditing({
              id: "",
              tableNumber: "",
              capacity: 2,
              qrCodeUrl: null,
            })
          }
        >
          <Plus className="mr-1 size-4" />
          Add table
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Summary title="Available" value={available} tone="green" />
        <Summary title="Occupied" value={occupied} tone="amber" />
        <Summary title="Reserved" value={reserved} tone="slate" />
      </div>

      {tables.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              size="sm"
              className="[--card-spacing:--spacing(3)]"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`grid size-9 place-items-center rounded-lg ${table.status === "available" ? "bg-emerald-500/10 text-emerald-700" : table.status === "occupied" ? "bg-amber-500/10 text-amber-700" : "bg-muted text-muted-foreground"}`}
                  >
                    <Table2 className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      Table {table.tableNumber}
                    </CardTitle>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {table.capacity} seats
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    table.status === "occupied"
                      ? "default"
                      : table.status === "reserved"
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {table.status}
                </Badge>
              </CardHeader>
              <CardContent className="gap-3">
                <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-2">
                  {table.qrCodeUrl ? (
                    <a
                      href={table.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block"
                    >
                      <img
                        src={table.qrCodeUrl}
                        alt={`QR code for Table ${table.tableNumber}`}
                        className="size-28 object-contain"
                      />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-background/90 py-1 text-[10px] opacity-0 transition group-hover:opacity-100">
                        <ExternalLink className="size-3" />
                        Open QR link
                      </span>
                    </a>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      <QrCode className="mx-auto mb-1 size-6 opacity-50" />
                      No QR code added
                    </div>
                  )}
                </div>
                {table.activeOrderNumber ? (
                  <p className="text-xs text-muted-foreground">
                    Active order{" "}
                    <span className="font-medium text-foreground">
                      {table.activeOrderNumber}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No active order
                  </p>
                )}
                <div className="flex flex-wrap justify-between gap-2 border-t pt-2">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        changeStatus(
                          table,
                          table.status === "reserved" ? "available" : "reserved"
                        )
                      }
                      disabled={busy || table.status === "occupied"}
                    >
                      {table.status === "reserved"
                        ? "Set available"
                        : "Reserve"}
                    </Button>
                    {table.qrCodeUrl === `/api/tables/${table.id}/qr` ? (
                      <a
                        href={table.qrCodeUrl}
                        download={`table-${table.tableNumber}-qr.png`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Download className="size-3.5" />
                        Download PNG
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const data = new FormData()
                          data.set("id", table.id)
                          data.set("tableNumber", table.tableNumber)
                          data.set("capacity", String(table.capacity))
                          run(saveRestaurantTable, data)
                        }}
                        disabled={busy}
                      >
                        Generate PNG
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditing({
                          id: table.id,
                          tableNumber: table.tableNumber,
                          capacity: table.capacity,
                          qrCodeUrl: table.qrCodeUrl,
                        })
                      }
                      disabled={busy}
                    >
                      Edit
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete Table ${table.tableNumber}`}
                    onClick={() => void remove(table)}
                    disabled={busy}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card size="sm">
          <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-3">
              <Table2 className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-3 font-medium">No tables set up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a table to start assigning dine-in orders and QR codes.
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() =>
                setEditing({
                  id: "",
                  tableNumber: "",
                  capacity: 2,
                  qrCodeUrl: null,
                })
              }
            >
              <Plus className="mr-1 size-4" />
              Add first table
            </Button>
          </CardContent>
        </Card>
      )}

      {editing ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setEditing(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-form-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
          >
            <header className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="table-form-title" className="text-lg font-semibold">
                  {editing.id
                    ? `Edit Table ${editing.tableNumber}`
                    : "Add table"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Set the table details. A table-specific QR code is generated
                  automatically.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                <X className="size-5" />
              </button>
            </header>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                run(saveRestaurantTable, data)
              }}
            >
              <input type="hidden" name="id" value={editing.id} />
              <label className="grid gap-1.5 text-sm">
                Table number
                <input
                  name="tableNumber"
                  required
                  maxLength={20}
                  defaultValue={editing.tableNumber}
                  className="h-9 rounded-md border bg-background px-3"
                  placeholder="e.g. 01 or Patio A"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                Seat capacity
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={100}
                  required
                  defaultValue={editing.capacity}
                  className="h-9 rounded-md border bg-background px-3"
                />
              </label>
              {editing.qrCodeUrl ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Table QR code</p>
                  <img
                    src={editing.qrCodeUrl}
                    alt="QR preview"
                    className="mx-auto size-36 rounded border bg-white object-contain p-1"
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    QR is linked to this table and stays the same when table
                    details change.
                  </p>
                </div>
              ) : (
                <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  A QR code linked to this table will be generated when you
                  save.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save table"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Summary({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: "green" | "amber" | "slate"
}) {
  const color =
    tone === "green"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-muted-foreground"
  return (
    <Card size="sm" className="[--card-spacing:--spacing(1)]">
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={`text-base font-semibold tabular-nums ${color}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
