import { z } from "zod"

export const salesReportDateSchema = z.object({
  start: z.iso.date(),
  end: z.iso.date(),
})

export type SalesReportRange = z.infer<typeof salesReportDateSchema>
