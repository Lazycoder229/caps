import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import {
  ORDER_STATUS,
  ORDER_TYPE,
  type OrderStatus,
  type OrderType,
} from "./enums"
import { decimal } from "./transformers"
import { RestaurantTable } from "./RestaurantTable"
import { Customer } from "./Customer"
import { User } from "./User"
import { OrderItem } from "./OrderItem"
import { Payment } from "./Payment"
import { OrderDiscount } from "./OrderDiscount"
import { OrderPromotion } from "./OrderPromotion"
import { OrderStatusHistory } from "./OrderStatusHistory"
import { OrderVoid } from "./OrderVoid"
import { LoyaltyTransaction } from "./LoyaltyTransaction"
import { Delivery } from "./Delivery"

@Entity("orders")
@Index("order_number", ["orderNumber"], { unique: true })
@Index("orders_status_idx", ["status"])
@Index("orders_created_at_idx", ["createdAt"])
@Index("orders_table_id_idx", ["tableId"])
export class Order {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_number", type: "varchar", length: 30 })
  orderNumber!: string

  @Column({ name: "table_id", type: "char", length: 36, nullable: true })
  tableId!: string | null

  @Column({ name: "customer_id", type: "char", length: 36, nullable: true })
  customerId!: string | null

  @Column({ name: "order_type", type: "enum", enum: ORDER_TYPE })
  orderType!: OrderType

  @Column({ type: "enum", enum: ORDER_STATUS, default: "pending" })
  status!: OrderStatus

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  subtotal!: number

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  discount!: number

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  tax!: number

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  total!: number

  @Column({ name: "delivery_fee", type: "decimal", precision: 10, scale: 2, default: 0, transformer: decimal })
  deliveryFee!: number

  @Column({
    name: "created_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  createdByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  /** Free-form in the DB (varchar): e.g. 'not_required', 'pending', 'paid'. */
  @Column({
    name: "payment_status",
    type: "varchar",
    length: 32,
    default: "not_required",
  })
  paymentStatus!: string

  @Column({
    name: "payment_method",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  paymentMethod!: string | null

  @Column({
    name: "payment_reference",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  paymentReference!: string | null

  @Column({
    name: "customer_payment_reference",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  customerPaymentReference!: string | null

  @Column({
    name: "payment_reference_token",
    type: "char",
    length: 36,
    nullable: true,
    unique: true,
  })
  paymentReferenceToken!: string | null

  @Column({ name: "guest_ip_hash", type: "char", length: 64, nullable: true })
  guestIpHash!: string | null

  /** Soft-hide from the admin list (not a delete). */
  @Column({ name: "admin_hidden_at", type: "datetime", nullable: true })
  adminHiddenAt!: Date | null

  /** Hide a completed/cancelled order from its customer's history without erasing accounting records. */
  @Column({ name: "customer_hidden_at", type: "datetime", nullable: true })
  customerHiddenAt!: Date | null

  @ManyToOne(() => RestaurantTable, (t) => t.orders, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "table_id" })
  table!: Relation<RestaurantTable> | null

  @ManyToOne(() => Customer, (c) => c.orders, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Relation<Customer> | null

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "created_by_staff_id" })
  createdBy!: Relation<User> | null

  @OneToMany(() => OrderItem, (i) => i.order)
  items!: Relation<OrderItem>[]

  @OneToMany(() => Payment, (p) => p.order)
  payments!: Relation<Payment>[]

  @OneToMany(() => OrderDiscount, (d) => d.order)
  discounts!: Relation<OrderDiscount>[]

  @OneToMany(() => OrderPromotion, (p) => p.order)
  promotions!: Relation<OrderPromotion>[]

  @OneToMany(() => OrderStatusHistory, (h) => h.order)
  statusHistory!: Relation<OrderStatusHistory>[]

  @OneToMany(() => OrderVoid, (v) => v.order)
  voids!: Relation<OrderVoid>[]

  @OneToMany(() => LoyaltyTransaction, (t) => t.order)
  loyaltyTransactions!: Relation<LoyaltyTransaction>[]

  @OneToOne(() => Delivery, (delivery) => delivery.order)
  delivery!: Relation<Delivery> | null
}
