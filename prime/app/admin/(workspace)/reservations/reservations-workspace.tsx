"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useReservations } from "./hooks/use-reservations"
import type { ReservationRow, ReservationTableOption } from "./types"
import type { ReservationStatus } from "@/lib/database/entities/entities/enums"

type Filter = "all" | "upcoming" | "today" | "pending" | "confirmed" | "history"
type Draft = ReservationRow | null

const statusLabel: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
}
const statusVariant: Record<
  ReservationStatus,
  "outline" | "default" | "secondary" | "destructive"
> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
  completed: "secondary",
  no_show: "destructive",
}
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "history", label: "History" },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`))
}

export function ReservationsWorkspace({
  reservations,
  tables,
  today,
}: {
  reservations: ReservationRow[]
  tables: ReservationTableOption[]
  today: string
}) {
  const [filter, setFilter] = useState<Filter>("upcoming")
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<Draft>(null)
  const { pending, save, setStatus, remove } = useReservations()
  const active = reservations.filter((row) =>
    ["pending", "confirmed"].includes(row.status)
  )
  const todayCount = active.filter(
    (row) => row.reservationDate === today
  ).length
  const pendingCount = active.filter((row) => row.status === "pending").length

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return reservations.filter((row) => {
      const statusHistory = ["cancelled", "completed", "no_show"].includes(
        row.status
      )
      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" &&
          !statusHistory &&
          row.reservationDate >= today) ||
        (filter === "today" &&
          row.reservationDate === today &&
          !statusHistory) ||
        (filter === "pending" && row.status === "pending") ||
        (filter === "confirmed" && row.status === "confirmed") ||
        (filter === "history" && statusHistory)
      const matchesQuery =
        !needle ||
        [
          row.customerName,
          row.contactNumber,
          row.email,
          row.tableNumber,
          row.notes,
        ].some((value) => value?.toLowerCase().includes(needle))
      return matchesFilter && matchesQuery
    })
  }, [reservations, filter, query, today])

  function openNew() {
    setDraft({
      id: "",
      customerName: "",
      contactNumber: "",
      email: "",
      tableId: null,
      tableNumber: null,
      tableCapacity: null,
      reservationDate: today,
      reservationTime: "18:00",
      numberOfGuests: 2,
      status: "pending",
      notes: "",
      createdAt: "",
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await save(new FormData(event.currentTarget))
    if (result.ok) setDraft(null)
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule guests, assign tables, and manage reservation status.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 size-4" />
          New reservation
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Summary label="Active reservations" value={active.length} />
        <Summary label="Today" value={todayCount} />
        <Summary label="Awaiting confirmation" value={pendingCount} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${filter === item.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
              {item.id === "pending" ? (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <label className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search reservations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, contact, table..."
            className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <Card size="sm" className="overflow-hidden [--card-spacing:--spacing(0)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Date & time</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((row) => (
                <tr key={row.id} className="align-middle hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.contactNumber}
                      {row.email ? ` · ${row.email}` : ""}
                    </p>
                    {row.notes ? (
                      <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                        Note: {row.notes}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p>{formatDate(row.reservationDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.reservationTime}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5 text-muted-foreground" />
                      {row.numberOfGuests}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.tableNumber ? (
                      `Table ${row.tableNumber}`
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusVariant[row.status]}
                      className="capitalize"
                    >
                      {statusLabel[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {row.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => setStatus(row.id, "confirmed")}
                        >
                          Confirm
                        </Button>
                      ) : null}
                      {row.status === "confirmed" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setStatus(row.id, "completed")}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setStatus(row.id, "no_show")}
                          >
                            No show
                          </Button>
                        </>
                      ) : null}
                      {row.status === "pending" ||
                      row.status === "confirmed" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          aria-label="Edit reservation"
                          onClick={() => setDraft(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {row.status === "pending" ||
                      row.status === "confirmed" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => setStatus(row.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        aria-label="Delete reservation"
                        onClick={() => void remove(row.id, row.customerName)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <CalendarDays className="size-7 text-muted-foreground" />
                      <p className="mt-2 font-medium">No reservations found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Adjust the search or add a reservation for a guest.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {draft ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setDraft(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-form-title"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl"
          >
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="reservation-form-title"
                  className="text-lg font-semibold"
                >
                  {draft.id ? "Edit reservation" : "New reservation"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Guest and seating details are saved to reservations and
                  customer records.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setDraft(null)}
                disabled={pending}
              >
                <X className="size-5" />
              </button>
            </header>
            <form className="space-y-3" onSubmit={submit}>
              <input type="hidden" name="id" value={draft.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Guest name">
                  <input
                    name="customerName"
                    required
                    maxLength={100}
                    defaultValue={draft.customerName}
                    className={inputClass}
                    autoFocus
                  />
                </Field>
                <Field label="Contact number">
                  <input
                    name="contactNumber"
                    required
                    maxLength={20}
                    defaultValue={draft.contactNumber}
                    className={inputClass}
                  />
                </Field>
                <Field label="Email (optional)">
                  <input
                    name="email"
                    type="email"
                    maxLength={255}
                    defaultValue={draft.email ?? ""}
                    className={inputClass}
                  />
                </Field>
                <Field label="Number of guests">
                  <input
                    name="numberOfGuests"
                    type="number"
                    required
                    min={1}
                    max={100}
                    defaultValue={draft.numberOfGuests}
                    className={inputClass}
                  />
                </Field>
                <Field label="Reservation date">
                  <input
                    name="reservationDate"
                    type="date"
                    required
                    min={today}
                    defaultValue={draft.reservationDate}
                    className={inputClass}
                  />
                </Field>
                <Field label="Reservation time">
                  <span className="relative">
                    <Clock3 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      name="reservationTime"
                      type="time"
                      required
                      defaultValue={draft.reservationTime}
                      className={`${inputClass} pl-9`}
                    />
                  </span>
                </Field>
                <Field label="Table (optional)">
                  <select
                    name="tableId"
                    defaultValue={draft.tableId ?? ""}
                    className={inputClass}
                  >
                    <option value="">Assign later</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        Table {table.tableNumber} · {table.capacity} seats
                        {table.status === "occupied"
                          ? " · currently occupied"
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Notes (optional)">
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={2000}
                  defaultValue={draft.notes ?? ""}
                  className={`${inputClass} h-auto py-2`}
                  placeholder="Special requests or occasion"
                />
              </Field>
              <p className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                Assigned table capacity and same table/date/time conflicts are
                checked before saving. Reservations do not change the table’s
                live occupied status.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                  disabled={pending}
                >
                  Close
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Saving…"
                    : draft.id
                      ? "Save changes"
                      : "Create reservation"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm" className="[--card-spacing:--spacing(1)]">
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-base font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}
