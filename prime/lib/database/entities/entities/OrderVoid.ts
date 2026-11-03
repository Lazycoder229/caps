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
import { VOID_STATUS, type VoidStatus } from "./enums"
import { Order } from "./Order"
import { User } from "./User"

@Entity("order_voids")
@Index("order_voids_order_idx", ["orderId"])
export class OrderVoid {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  @Column({
    name: "requested_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  requestedByStaffId!: string | null

  @Column({
    name: "approved_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  approvedByStaffId!: string | null

  @Column({ type: "text" })
  reason!: string

  @Column({ type: "enum", enum: VOID_STATUS, default: "pending" })
  status!: VoidStatus

  @CreateDateColumn({ name: "requested_at", type: "timestamp" })
  requestedAt!: Date

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt!: Date | null

  @Column({ name: "resolution_notes", type: "text", nullable: true })
  resolutionNotes!: string | null

  @ManyToOne(() => Order, (o) => o.voids, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "requested_by_staff_id" })
  requestedBy!: Relation<User> | null

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "approved_by_staff_id" })
  approvedBy!: Relation<User> | null
}
