import { z } from "zod"
import { RESERVATION_STATUS } from "@/lib/database/entities/entities/enums"

export const reservationIdSchema = z.string().uuid()
export const reservationStatusSchema = z.enum(RESERVATION_STATUS)

export const reservationSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  customerName: z.string().trim().min(1).max(100),
  contactNumber: z.string().trim().min(1).max(20),
  email: z
    .union([z.email().max(255), z.literal("")])
    .transform((value) => value || null),
  tableId: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((value) => value || null),
  reservationDate: z.iso.date(),
  reservationTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid reservation time."),
  numberOfGuests: z.coerce.number().int().min(1).max(100),
  notes: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null),
})

export type ReservationInput = z.infer<typeof reservationSchema>
