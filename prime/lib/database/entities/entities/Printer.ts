import { Column, Entity, PrimaryColumn } from "typeorm"
import {
  PRINTER_CONNECTION,
  PRINTER_LOCATION,
  type PrinterConnection,
  type PrinterLocation,
} from "./enums"

@Entity("printers")
export class Printer {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({ type: "enum", enum: PRINTER_LOCATION })
  location!: PrinterLocation

  @Column({ name: "connection_type", type: "enum", enum: PRINTER_CONNECTION })
  connectionType!: PrinterConnection

  @Column({ name: "ip_address", type: "varchar", length: 50, nullable: true })
  ipAddress!: string | null

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean
}
