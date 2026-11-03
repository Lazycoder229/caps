import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import type { Order } from "./Order"
import { decimal } from "./transformers"

export const DELIVERY_STATUS = [
  "pending",
  "assigned",
  "picked_up",
  "delivered",
  "failed",
  "cancelled",
] as const
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number]

@Entity("deliveries")
export class Delivery {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36, unique: true })
  orderId!: string

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string

  @Column({ name: "recipient_phone", type: "varchar", length: 20 })
  recipientPhone!: string

  @Column({ name: "address", type: "text" })
  address!: string

  @Column({ type: "decimal", precision: 10, scale: 7, transformer: decimal })
  latitude!: number

  @Column({ type: "decimal", precision: 10, scale: 7, transformer: decimal })
  longitude!: number

  @Column({ name: "delivery_fee", type: "decimal", precision: 10, scale: 2, transformer: decimal })
  deliveryFee!: number

  @Column({ type: "text", nullable: true })
  instructions!: string | null

  @Column({ type: "enum", enum: DELIVERY_STATUS, default: "pending" })
  status!: DeliveryStatus

  @Column({ name: "assigned_rider_id", type: "char", length: 36, nullable: true })
  assignedRiderId!: string | null

  @Column({ name: "picked_up_at", type: "datetime", nullable: true })
  pickedUpAt!: Date | null

  @Column({ name: "delivered_at", type: "datetime", nullable: true })
  deliveredAt!: Date | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  @OneToOne("Order", "delivery", { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>
}
