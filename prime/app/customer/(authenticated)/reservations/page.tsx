import { getInitializedDataSource } from "@/lib/database/data-source"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { CustomerReservations } from "./workspace"

function nowInManila() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  }
}

export default async function CustomerReservationsPage() {
  const customer = await requireCustomerSession()
  const reservations = await (
    await getInitializedDataSource()
  )
    .getRepository(Reservation)
    .find({
      where: { customerId: customer.id },
      relations: { table: true },
      order: { reservationDate: "ASC", reservationTime: "ASC" },
      take: 200,
    })

  return (
    <CustomerReservations
      customer={{
        name: customer.name,
        contactNumber: customer.contactNumber ?? "",
      }}
      now={nowInManila()}
      reservations={reservations.map((reservation) => ({
        id: reservation.id,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime.slice(0, 5),
        numberOfGuests: reservation.numberOfGuests,
        status: reservation.status,
        notes: reservation.notes,
        tableNumber: reservation.table?.tableNumber ?? null,
      }))}
    />
  )
}
