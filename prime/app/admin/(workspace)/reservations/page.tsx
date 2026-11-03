import { getInitializedDataSource } from "@/lib/database/data-source"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { ReservationsWorkspace } from "./reservations-workspace"
import type { ReservationRow, ReservationTableOption } from "./types"

function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default async function ReservationsPage() {
  try {
    const source = await getInitializedDataSource()
    const [reservations, tables] = await Promise.all([
      source.getRepository(Reservation).find({
        relations: { table: true },
        order: { reservationDate: "ASC", reservationTime: "ASC" },
        take: 500,
      }),
      source.getRepository(RestaurantTable).find({
        order: { tableNumber: "ASC" },
      }),
    ])
    const rows: ReservationRow[] = reservations.map((reservation) => ({
      id: reservation.id,
      customerName: reservation.customerName,
      contactNumber: reservation.contactNumber,
      email: reservation.email,
      tableId: reservation.tableId,
      tableNumber: reservation.table?.tableNumber ?? null,
      tableCapacity: reservation.table?.capacity ?? null,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime.slice(0, 5),
      numberOfGuests: reservation.numberOfGuests,
      status: reservation.status,
      notes: reservation.notes,
      createdAt: reservation.createdAt.toISOString(),
    }))
    const tableOptions: ReservationTableOption[] = tables.map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
    }))
    return (
      <ReservationsWorkspace
        reservations={rows}
        tables={tableOptions}
        today={todayInManila()}
      />
    )
  } catch (error) {
    console.error("Unable to load reservations:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule guests, assign tables, and manage reservation status.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect reservations."
            : "Reservations could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
