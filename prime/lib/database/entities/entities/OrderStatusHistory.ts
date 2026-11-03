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
import { Order } from "./Order"
import { User } from "./User"

@Entity("order_status_history")
@Index("order_status_history_order_idx", ["orderId"])
export class OrderStatusHistory {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  /** varchar in the DB; values mirror orders.status (see ORDER_STATUS). */
  @Column({ type: "varchar", length: 30 })
  status!: string

  @Column({
    name: "changed_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  changedByStaffId!: string | null

  @CreateDateColumn({ name: "changed_at", type: "timestamp" })
  changedAt!: Date

  @ManyToOne(() => Order, (o) => o.statusHistory, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "changed_by_staff_id" })
  changedBy!: Relation<User> | null
}
