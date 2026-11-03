"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  cancelCustomerReservation,
  requestCustomerReservation,
} from "@/app/customer/reservation-actions"
import type { ReservationStatus } from "@/lib/database/entities/entities/enums"

type ReservationRow = {
  id: string
  reservationDate: string
  reservationTime: string
  numberOfGuests: number
  status: ReservationStatus
  notes: string | null
  tableNumber: string | null
}

type ViewFilter = "upcoming" | "history" | "all"

const statusLabels: Record<ReservationStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
}

const statusVariants: Record<
  ReservationStatus,
  "outline" | "default" | "secondary" | "destructive"
> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
  completed: "secondary",
  no_show: "destructive",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`))
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(Date.UTC(2020, 0, 1, hour - 8, minute)))
}

function isFuture(row: ReservationRow, now: { date: string; time: string }) {
  return (
    row.reservationDate > now.date ||
    (row.reservationDate === now.date && row.reservationTime > now.time)
  )
}

export function CustomerReservations({
  customer,
  now,
  reservations,
}: {
  customer: { name: string; contactNumber: string }
  now: { date: string; time: string }
  reservations: ReservationRow[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<ViewFilter>("upcoming")
  const [formOpen, setFormOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<ReservationRow | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const future = (row: ReservationRow) =>
    isFuture(row, now) && ["pending", "confirmed"].includes(row.status)

  const upcomingCount = reservations.filter(future).length
  const pendingCount = reservations.filter(
    (row) => row.status === "pending" && future(row)
  ).length
  const visible = useMemo(() => {
    const rows = reservations.filter((row) => {
      const upcoming =
        isFuture(row, now) && ["pending", "confirmed"].includes(row.status)
      if (filter === "upcoming") return upcoming
      if (filter === "history") return !upcoming
      return true
    })
    return rows.sort((left, right) => {
      const timeOrder = `${left.reservationDate}T${left.reservationTime}`.localeCompare(
        `${right.reservationDate}T${right.reservationTime}`
      )
      return filter === "history" ? -timeOrder : timeOrder
    })
  }, [filter, now, reservations])

  function submitReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await requestCustomerReservation(formData)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setFormOpen(false)
      setMessage(result.message)
      router.refresh()
    })
  }

  function cancelReservation() {
    if (!cancelTarget) return
    setError("")
    startTransition(async () => {
      const result = await cancelCustomerReservation(cancelTarget.id)
      if (!result.ok) {
        setError(result.message)
        setCancelTarget(null)
        return
      }
      setCancelTarget(null)
      setMessage(result.message)
      router.refresh()
    })
  }

  return (
    <main className="w-full space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Plan your visit</p>
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a table and track its confirmation here.
          </p>
        </div>
        <Button onClick={() => { setError(""); setFormOpen(true) }}>
          <Plus className="size-4" />
          Make a reservation
        </Button>
      </header>

      {message ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/5 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          {message}
        </p>
      ) : null}
      {error && !formOpen && !cancelTarget ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Summary label="Upcoming" value={upcomingCount} />
        <Summary label="Awaiting confirmation" value={pendingCount} />
        <Summary label="Total requests" value={reservations.length} className="col-span-2 sm:col-span-1" />
      </section>

      <div className="flex w-full gap-1 rounded-lg border bg-muted/30 p-1 sm:w-fit">
        {([
          ["upcoming", "Upcoming"],
          ["history", "History"],
          ["all", "All"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`min-w-0 flex-1 rounded-md px-3 py-2 text-sm transition-colors sm:flex-none ${filter === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        {visible.map((reservation) => {
          const canCancel =
            future(reservation) &&
            (reservation.status === "pending" || reservation.status === "confirmed")
          return (
            <Card key={reservation.id} size="sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{formatDate(reservation.reservationDate)}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock3 className="size-3.5" />
                        {formatTime(reservation.reservationTime)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariants[reservation.status]} className="shrink-0 capitalize">
                    {statusLabels[reservation.status]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? "guest" : "guests"}
                  </span>
                  {reservation.tableNumber ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      Table {reservation.tableNumber}
                    </span>
                  ) : null}
                </div>
                {reservation.notes ? (
                  <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{reservation.notes}</p>
                ) : null}
                {canCancel ? (
                  <div className="flex justify-end border-t pt-3">
                    <Button variant="outline" size="sm" onClick={() => { setError(""); setCancelTarget(reservation) }}>
                      Cancel request
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
        {!visible.length ? (
          <Card size="sm" className="lg:col-span-2">
            <CardContent className="flex flex-col items-center px-4 py-6 text-center">
              <CalendarDays className="size-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">
                {filter === "upcoming" ? "No upcoming reservations" : "No reservations here yet"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Make a reservation request and the restaurant team will confirm it.
              </p>
              {filter !== "history" ? (
                <Button className="mt-4" variant="outline" onClick={() => setFormOpen(true)}>
                  <Plus className="size-4" />
                  Make a reservation
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setFormOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-reservation-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-4 shadow-2xl sm:p-5">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="customer-reservation-title" className="text-lg font-semibold">Request a reservation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your request stays pending until the restaurant confirms it.</p>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" disabled={pending} onClick={() => setFormOpen(false)}><X /></Button>
            </header>
            <form onSubmit={submitReservation} className="space-y-3">
              <p className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                Reservation for <span className="font-medium">{customer.name}</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Contact number">
                  <input name="contactNumber" type="tel" required maxLength={20} defaultValue={customer.contactNumber} autoComplete="tel" placeholder="09XX XXX XXXX" className={inputClass} />
                </Field>
                <Field label="Number of guests">
                  <input name="numberOfGuests" type="number" required min={1} max={100} defaultValue={2} className={inputClass} />
                </Field>
                <Field label="Date">
                  <input name="reservationDate" type="date" required min={now.date} defaultValue={now.date} className={inputClass} />
                </Field>
                <Field label="Time">
                  <input name="reservationTime" type="time" required defaultValue="18:00" className={inputClass} />
                </Field>
              </div>
              <Field label="Notes or special requests (optional)">
                <textarea name="notes" rows={3} maxLength={2000} placeholder="Celebration, seating preference, or other details" className={`${inputClass} h-auto resize-y py-2`} />
              </Field>
              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={pending} onClick={() => setFormOpen(false)}>Keep browsing</Button>
                <Button type="submit" disabled={pending}>{pending ? "Sending request…" : "Send reservation request"}</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {cancelTarget ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4" onClick={() => !pending && setCancelTarget(null)}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-reservation-title" className="w-full max-w-sm rounded-xl border bg-background p-4 shadow-xl sm:p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cancel-reservation-title" className="font-semibold">Cancel this reservation?</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(cancelTarget.reservationDate)} · {formatTime(cancelTarget.reservationTime)}</p>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" disabled={pending} onClick={() => setCancelTarget(null)}><X /></Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">The restaurant will see that you cancelled this request.</p>
            {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" disabled={pending} onClick={() => setCancelTarget(null)}>Keep it</Button>
              <Button variant="destructive" disabled={pending} onClick={cancelReservation}>{pending ? "Cancelling…" : "Cancel reservation"}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function Summary({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <Card size="sm" className={className}>
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-base font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}
