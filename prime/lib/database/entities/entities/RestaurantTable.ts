import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { TABLE_STATUS, type TableStatus } from "./enums"
import { Order } from "./Order"
import { Reservation } from "./Reservation"

@Entity("restaurant_tables")
@Index("table_number", ["tableNumber"], { unique: true })
export class RestaurantTable {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "table_number", type: "varchar", length: 20 })
  tableNumber!: string

  @Column({ type: "int", unsigned: true })
  capacity!: number

  @Column({ name: "qr_code_url", type: "varchar", length: 500, nullable: true })
  qrCodeUrl!: string | null

  @Column({ type: "enum", enum: TABLE_STATUS, default: "available" })
  status!: TableStatus

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "occupied_at", type: "datetime", nullable: true })
  occupiedAt!: Date | null

  @OneToMany(() => Order, (o) => o.table)
  orders!: Relation<Order>[]

  @OneToMany(() => Reservation, (r) => r.table)
  reservations!: Relation<Reservation>[]
}
