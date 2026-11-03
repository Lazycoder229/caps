import type {
  PrinterConnection,
  PrinterLocation,
} from "@/lib/database/entities/entities/enums"

export type PrinterRow = {
  id: string
  name: string
  location: PrinterLocation
  connectionType: PrinterConnection
  ipAddress: string | null
  isActive: boolean
}
