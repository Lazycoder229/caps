import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { RESERVATION_STATUS, type ReservationStatus } from "./enums"
import { Customer } from "./Customer"
import { RestaurantTable } from "./RestaurantTable"
import { User } from "./User"

@Entity("reservations")
@Index("reservations_date_time_idx", ["reservationDate", "reservationTime"])
export class Reservation {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "customer_id", type: "char", length: 36, nullable: true })
  customerId!: string | null

  @Column({ name: "customer_name", type: "varchar", length: 100 })
  customerName!: string

  @Column({ name: "contact_number", type: "varchar", length: 20 })
  contactNumber!: string

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null

  @Column({ name: "table_id", type: "char", length: 36, nullable: true })
  tableId!: string | null

  /** 'YYYY-MM-DD' */
  @Column({ name: "reservation_date", type: "date" })
  reservationDate!: string

  /** 'HH:mm:ss' */
  @Column({ name: "reservation_time", type: "time" })
  reservationTime!: string

  @Column({ name: "number_of_guests", type: "int", unsigned: true })
  numberOfGuests!: number

  @Column({ type: "enum", enum: RESERVATION_STATUS, default: "pending" })
  status!: ReservationStatus

  @Column({ type: "text", nullable: true })
  notes!: string | null

  @Column({
    name: "created_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  createdByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => Customer, (c) => c.reservations, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Relation<Customer> | null

  @ManyToOne(() => RestaurantTable, (t) => t.reservations, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "table_id" })
  table!: Relation<RestaurantTable> | null

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "created_by_staff_id" })
  createdBy!: Relation<User> | null
}
