"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import {
  reservationIdSchema,
  reservationSchema,
  reservationStatusSchema,
} from "@/lib/validations/reservations"

const bookableStatuses = ["pending", "confirmed"] as const

function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export async function saveReservation(data: FormData) {
  const parsed = reservationSchema.safeParse({
    id: String(data.get("id") ?? ""),
    customerName: String(data.get("customerName") ?? ""),
    contactNumber: String(data.get("contactNumber") ?? ""),
    email: String(data.get("email") ?? ""),
    tableId: String(data.get("tableId") ?? ""),
    reservationDate: String(data.get("reservationDate") ?? ""),
    reservationTime: String(data.get("reservationTime") ?? ""),
    numberOfGuests: String(data.get("numberOfGuests") ?? ""),
    notes: String(data.get("notes") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: "Enter valid customer and reservation details.",
    }
  if (parsed.data.reservationDate < todayInManila())
    return { ok: false, message: "Reservation date cannot be in the past." }

  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation)
      const customerRepo = manager.getRepository(Customer)
      const tableRepo = manager.getRepository(RestaurantTable)
      const reservation = parsed.data.id
        ? await reservationRepo.findOneBy({ id: parsed.data.id })
        : reservationRepo.create({ id: randomUUID(), status: "pending" })
      if (!reservation)
        throw new Error("Reservation not found. Refresh and try again.")

      if (parsed.data.tableId) {
        const table = await tableRepo
          .createQueryBuilder("table")
          .setLock("pessimistic_write")
          .where("table.id = :id", { id: parsed.data.tableId })
          .getOne()
        if (!table) throw new Error("Selected table no longer exists.")
        if (table.capacity < parsed.data.numberOfGuests)
          throw new Error(
            `Table ${table.tableNumber} fits up to ${table.capacity} guests.`
          )
        const conflict = await reservationRepo
          .createQueryBuilder("reservation")
          .where("reservation.table_id = :tableId", { tableId: table.id })
          .andWhere("reservation.reservation_date = :date", {
            date: parsed.data.reservationDate,
          })
          .andWhere("reservation.reservation_time = :time", {
            time: `${parsed.data.reservationTime}:00`,
          })
          .andWhere("reservation.status IN (:...statuses)", {
            statuses: [...bookableStatuses],
          })
          .andWhere("reservation.id != :id", { id: reservation.id })
          .getOne()
        if (conflict)
          throw new Error(
            "That table already has a reservation at this date and time."
          )
      }

      let customer = await customerRepo.findOne({
        where: { contactNumber: parsed.data.contactNumber },
        order: { createdAt: "ASC" },
      })
      if (!customer) {
        customer = customerRepo.create({
          id: randomUUID(),
          name: parsed.data.customerName,
          contactNumber: parsed.data.contactNumber,
          email: parsed.data.email,
          isGuest: true,
          loyaltyPointsBalance: 0,
          password: null,
          updatedAt: null,
          dateOfBirth: null,
          pwdIdNumber: null,
        })
      } else {
        customer.name = parsed.data.customerName
        customer.email = parsed.data.email
      }
      await customerRepo.save(customer)

      reservation.customerId = customer.id
      reservation.customerName = parsed.data.customerName
      reservation.contactNumber = parsed.data.contactNumber
      reservation.email = parsed.data.email
      reservation.tableId = parsed.data.tableId
      reservation.reservationDate = parsed.data.reservationDate
      reservation.reservationTime = `${parsed.data.reservationTime}:00`
      reservation.numberOfGuests = parsed.data.numberOfGuests
      reservation.notes = parsed.data.notes
      await reservationRepo.save(reservation)
    })
    revalidatePath("/admin/reservations")
    revalidatePath("/admin/tables")
    return { ok: true, message: "Reservation saved." }
  } catch (error) {
    console.error("Unable to save reservation:", error)
    const message = error instanceof Error ? error.message : ""
    const known = [
      "Reservation not found. Refresh and try again.",
      "Selected table no longer exists.",
    ]
    return {
      ok: false,
      message:
        known.includes(message) ||
        message.startsWith("Table ") ||
        message.startsWith("That table ")
          ? message
          : message.includes("ER_DUP_ENTRY") ||
              message.toLowerCase().includes("duplicate")
            ? "That email address is already used by another customer."
            : "Could not save reservation. Check the database connection.",
    }
  }
}

export async function updateReservationStatus(
  idValue: string,
  statusValue: string
) {
  const id = reservationIdSchema.safeParse(idValue)
  const status = reservationStatusSchema.safeParse(statusValue)
  if (!id.success || !status.success)
    return { ok: false, message: "Choose a valid reservation status." }
  try {
    await (
      await getInitializedDataSource()
    ).transaction(async (manager) => {
      const repo = manager.getRepository(Reservation)
      const reservation = await repo
        .createQueryBuilder("reservation")
        .setLock("pessimistic_write")
        .where("reservation.id = :id", { id: id.data })
        .getOne()
      if (!reservation) throw new Error("Reservation not found.")
      const allowed: Record<typeof reservation.status, readonly string[]> = {
        pending: ["confirmed", "cancelled", "no_show"],
        confirmed: ["completed", "cancelled", "no_show"],
        cancelled: [],
        completed: [],
        no_show: [],
      }
      if (!allowed[reservation.status].includes(status.data))
        throw new Error("This reservation status cannot be changed that way.")
      reservation.status = status.data
      await repo.save(reservation)
    })
    revalidatePath("/admin/reservations")
    revalidatePath("/admin/tables")
    return {
      ok: true,
      message: `Reservation marked ${status.data.replaceAll("_", " ")}.`,
    }
  } catch (error) {
    console.error("Unable to update reservation status:", error)
    const message = error instanceof Error ? error.message : ""
    return {
      ok: false,
      message:
        message === "Reservation not found." ||
        message === "This reservation status cannot be changed that way."
          ? message
          : "Could not update reservation status.",
    }
  }
}

export async function deleteReservation(idValue: string) {
  const id = reservationIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid reservation." }
  try {
    const repo = (await getInitializedDataSource()).getRepository(Reservation)
    const result = await repo.delete({ id: id.data })
    if (!result.affected)
      return { ok: false, message: "Reservation not found." }
    revalidatePath("/admin/reservations")
    revalidatePath("/admin/tables")
    return { ok: true, message: "Reservation deleted." }
  } catch (error) {
    console.error("Unable to delete reservation:", error)
    return { ok: false, message: "Could not delete reservation." }
  }
}
