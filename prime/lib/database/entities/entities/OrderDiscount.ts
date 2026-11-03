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
import { decimal } from "./transformers"
import { Order } from "./Order"
import { DiscountType } from "./DiscountType"
import { User } from "./User"

/** Senior / PWD discount applied to an order. */
@Entity("order_discounts")
@Index("order_discounts_order_idx", ["orderId"])
export class OrderDiscount {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  @Column({ name: "discount_type_id", type: "char", length: 36 })
  discountTypeId!: string

  @Column({ name: "id_number", type: "varchar", length: 50, nullable: true })
  idNumber!: string | null

  @Column({ name: "holder_name", type: "varchar", length: 100 })
  holderName!: string

  @Column({
    name: "discount_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  discountAmount!: number

  @Column({
    name: "applied_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  appliedByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => Order, (o) => o.discounts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => DiscountType, (d) => d.orderDiscounts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "discount_type_id" })
  discountType!: Relation<DiscountType>

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "applied_by_staff_id" })
  appliedBy!: Relation<User> | null
}
