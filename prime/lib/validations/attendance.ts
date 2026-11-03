import { z } from "zod"

// ENUMS (kapareho ng DB)
export const attendanceStatus = z.enum([
  "on_time",
  "late",
  "overtime",
  "incomplete",
  "absent",
])
export const attendanceMethod = z.enum(["rfid", "manual", "pin"])

// Reusable pieces
const uuid = z.string().uuid()
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dapat YYYY-MM-DD ang format")
// decimal(5,2) -> max 999.99, hanggang 2 decimal places lang
const hours = z
  .number()
  .min(0)
  .max(999.99)
  .refine((n) => Math.round(n * 100) === n * 100 || Number.isInteger(n * 100), {
    message: "Hanggang 2 decimal places lang",
  })

// FULL ROW (para sa response / pag-parse ng galing DB)
export const attendanceLogSchema = z.object({
  id: uuid,
  employee_id: uuid,
  log_date: dateOnly,
  clock_in: z.coerce.date(),
  clock_out: z.coerce.date().nullable(),
  total_hours: hours.nullable(),
  late_minutes: z.number().int().min(0),
  overtime_hours: hours,
  status: attendanceStatus,
  method: attendanceMethod,
  rfid_card_uid_used: z.string().max(50).nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
})

// MANUAL ENTRY (admin ang nag-e-encode)
export const createAttendanceLogSchema = z
  .object({
    employee_id: uuid,
    log_date: dateOnly,
    clock_in: z.coerce.date(),
    clock_out: z.coerce.date().nullish(),
    method: attendanceMethod.default("manual"),
    rfid_card_uid_used: z.string().trim().min(1).max(50).nullish(),
    notes: z.string().trim().max(1000).nullish(),
  })
  .refine((d) => !d.clock_out || d.clock_out > d.clock_in, {
    message: "Dapat mas huli ang clock_out kaysa clock_in",
    path: ["clock_out"],
  })
  .refine((d) => d.method !== "rfid" || !!d.rfid_card_uid_used, {
    message: "Kailangan ang RFID card UID kapag RFID ang method",
    path: ["rfid_card_uid_used"],
  })

// RFID TAP (clock in/out gamit ang card)
export const rfidTapSchema = z.object({
  rfid_card_uid: z.string().trim().min(1).max(50),
})

// UPDATE / CORRECTION (lahat optional)
export const updateAttendanceLogSchema = z
  .object({
    clock_in: z.coerce.date(),
    clock_out: z.coerce.date().nullable(),
    status: attendanceStatus,
    notes: z.string().trim().max(1000).nullable(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Walang laman ang update",
  })
  .refine((d) => !d.clock_in || !d.clock_out || d.clock_out > d.clock_in, {
    message: "Dapat mas huli ang clock_out kaysa clock_in",
    path: ["clock_out"],
  })

// QUERY FILTERS (para sa list/report endpoint)
export const listAttendanceQuerySchema = z
  .object({
    employee_id: uuid.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    status: attendanceStatus.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "Dapat mas maaga o pareho ang from kaysa to",
    path: ["to"],
  })

// Types
export type AttendanceLog = z.infer<typeof attendanceLogSchema>
export type CreateAttendanceLogInput = z.infer<typeof createAttendanceLogSchema>
export type UpdateAttendanceLogInput = z.infer<typeof updateAttendanceLogSchema>
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>
