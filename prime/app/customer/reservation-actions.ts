"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Reservation } from "@/lib/database/entities/entities/Reservation"
import { requireCustomerSession } from "@/lib/customer-auth/session"

const reservationRequestSchema = z.object({
  contactNumber: z.string().trim().min(1, "Enter a contact number.").max(20),
  reservationDate: z.iso.date("Choose a valid reservation date."),
  reservationTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid reservation time."),
  numberOfGuests: z.coerce.number().int().min(1).max(100),
  notes: z.string().trim().max(2000),
})

function manilaDateTime() {
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

function isPastReservation(date: string, time: string) {
  const now = manilaDateTime()
  return date < now.date || (date === now.date && time <= now.time)
}

export async function requestCustomerReservation(formData: FormData) {
  const customer = await requireCustomerSession()
  const parsed = reservationRequestSchema.safeParse({
    contactNumber: String(formData.get("contactNumber") ?? ""),
    reservationDate: String(formData.get("reservationDate") ?? ""),
    reservationTime: String(formData.get("reservationTime") ?? ""),
    numberOfGuests: String(formData.get("numberOfGuests") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check your reservation details.",
    }
  if (isPastReservation(parsed.data.reservationDate, parsed.data.reservationTime))
    return { ok: false, message: "Choose a future date and time." }

  try {
    const source = await getInitializedDataSource()
    await source.getRepository(Reservation).save({
      id: randomUUID(),
      customerId: customer.id,
      customerName: customer.name,
      contactNumber: parsed.data.contactNumber,
      email: customer.email,
      tableId: null,
      reservationDate: parsed.data.reservationDate,
      reservationTime: `${parsed.data.reservationTime}:00`,
      numberOfGuests: parsed.data.numberOfGuests,
      status: "pending",
      notes: parsed.data.notes || null,
      createdByStaffId: null,
    })
    revalidatePath("/customer/reservations")
    revalidatePath("/admin/reservations")
    revalidatePath("/admin/tables")
    return {
      ok: true,
      message: "Reservation request sent. We’ll confirm it as soon as possible.",
    }
  } catch (error) {
    console.error("Unable to request customer reservation:", error)
    return {
      ok: false,
      message: "Could not send your reservation. Please try again.",
    }
  }
}

export async function cancelCustomerReservation(idValue: string) {
  const customer = await requireCustomerSession()
  const id = z.string().uuid().safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid reservation." }

  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const repository = manager.getRepository(Reservation)
      const reservation = await repository
        .createQueryBuilder("reservation")
        .setLock("pessimistic_write")
        .where("reservation.id = :id", { id: id.data })
        .andWhere("reservation.customer_id = :customerId", {
          customerId: customer.id,
        })
        .getOne()
      if (!reservation) throw new Error("Reservation not found.")
      if (!(["pending", "confirmed"] as const).includes(reservation.status as "pending" | "confirmed"))
        throw new Error("This reservation can no longer be cancelled.")
      if (isPastReservation(reservation.reservationDate, reservation.reservationTime.slice(0, 5)))
        throw new Error("This reservation time has already passed.")
      reservation.status = "cancelled"
      await repository.save(reservation)
    })
    revalidatePath("/customer/reservations")
    revalidatePath("/admin/reservations")
    revalidatePath("/admin/tables")
    return { ok: true, message: "Reservation cancelled." }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (
      message === "Reservation not found." ||
      message === "This reservation can no longer be cancelled." ||
      message === "This reservation time has already passed."
    )
      return { ok: false, message }
    console.error("Unable to cancel customer reservation:", error)
    return { ok: false, message: "Could not cancel this reservation. Try again." }
  }
}
