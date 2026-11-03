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
import { PAYMENT_METHOD, type PaymentMethod } from "./enums"
import { decimal } from "./transformers"
import { Order } from "./Order"
import { User } from "./User"

@Entity("payments")
@Index("receipt_number", ["receiptNumber"], { unique: true })
@Index("payments_order_idx", ["orderId"])
export class Payment {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  @Column({ name: "receipt_number", type: "varchar", length: 30 })
  receiptNumber!: string

  @Column({
    name: "amount_paid",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  amountPaid!: number

  @Column({ name: "payment_method", type: "enum", enum: PAYMENT_METHOD })
  paymentMethod!: PaymentMethod

  @Column({
    name: "reference_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  referenceNumber!: string | null

  @Column({
    name: "processed_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  processedByStaffId!: string | null

  @CreateDateColumn({ name: "paid_at", type: "timestamp" })
  paidAt!: Date

  @ManyToOne(() => Order, (o) => o.payments, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "processed_by_staff_id" })
  processedBy!: Relation<User> | null
}
