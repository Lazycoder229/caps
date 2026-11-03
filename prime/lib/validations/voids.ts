import { z } from "zod"
import { VOID_STATUS } from "@/lib/database/entities/entities/enums"

export const voidIdSchema = z.string().uuid()

export const createVoidRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(3, "Enter a reason for this void request.")
    .max(5000),
})

export const resolveVoidSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VOID_STATUS).refine((status) => status !== "pending"),
  resolutionNotes: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => value || null),
})

export type CreateVoidRequestInput = z.infer<typeof createVoidRequestSchema>
export type ResolveVoidInput = z.infer<typeof resolveVoidSchema>
