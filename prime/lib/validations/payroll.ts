import { z } from "zod"

export const payrollGenerationSchema = z.object({
  payMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid payroll month."),
  payday: z.enum(["5", "20"]),
})

export const payrollPeriodIdSchema = z.string().uuid("Invalid payroll period.")
