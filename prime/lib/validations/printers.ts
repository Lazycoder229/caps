import { z } from "zod"
import {
  PRINTER_CONNECTION,
  PRINTER_LOCATION,
} from "@/lib/database/entities/entities/enums"

export const printerIdSchema = z.string().uuid()

export const printerSchema = z
  .object({
    id: z.string().uuid().or(z.literal("")),
    name: z.string().trim().min(1, "Printer name is required.").max(100),
    location: z.enum(PRINTER_LOCATION),
    connectionType: z.enum(PRINTER_CONNECTION),
    ipAddress: z
      .string()
      .trim()
      .max(50)
      .transform((value) => value || null),
    isActive: z.boolean(),
  })
  .refine(
    (printer) =>
      printer.connectionType !== "network" || printer.ipAddress !== null,
    {
      message: "Enter the printer IP address or host for a network printer.",
      path: ["ipAddress"],
    }
  )

export type PrinterInput = z.infer<typeof printerSchema>
