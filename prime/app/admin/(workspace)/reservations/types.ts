import type { ReservationStatus } from "@/lib/database/entities/entities/enums"

export type ReservationRow = {
  id: string
  customerName: string
  contactNumber: string
  email: string | null
  tableId: string | null
  tableNumber: string | null
  tableCapacity: number | null
  reservationDate: string
  reservationTime: string
  numberOfGuests: number
  status: ReservationStatus
  notes: string | null
  createdAt: string
}

export type ReservationTableOption = {
  id: string
  tableNumber: string
  capacity: number
  status: "available" | "occupied" | "reserved"
}
