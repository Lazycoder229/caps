import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { Order } from "./Order"
import { Promotion } from "./Promotion"

@Entity("order_promotions")
export class OrderPromotion {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  @Column({ name: "promotion_id", type: "char", length: 36 })
  promotionId!: string

  @Column({
    name: "discount_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  discountAmount!: number

  @CreateDateColumn({ name: "applied_at", type: "timestamp" })
  appliedAt!: Date

  @ManyToOne(() => Order, (o) => o.promotions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => Promotion, (p) => p.orderPromotions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "promotion_id" })
  promotion!: Relation<Promotion>
}
