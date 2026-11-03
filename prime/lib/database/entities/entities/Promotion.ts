import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { PROMO_TYPE, type PromoType } from "./enums"
import { decimal } from "./transformers"
import { MenuItem } from "./MenuItem"
import { OrderPromotion } from "./OrderPromotion"
import { User } from "./User"

@Entity("promotions")
export class Promotion {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 150 })
  name!: string

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ name: "promo_type", type: "enum", enum: PROMO_TYPE })
  promoType!: PromoType

  /** Percent for 'percentage', peso amount for 'fixed_amount'. */
  @Column({
    name: "discount_value",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  discountValue!: number | null

  @Column({
    name: "min_spend",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  minSpend!: number | null

  /** 'YYYY-MM-DD' */
  @Column({ name: "start_date", type: "date" })
  startDate!: string

  /** 'YYYY-MM-DD' */
  @Column({ name: "end_date", type: "date" })
  endDate!: string

  @Column({ name: "usage_limit", type: "int", unsigned: true, nullable: true })
  usageLimit!: number | null

  @Column({ name: "usage_count", type: "int", unsigned: true, default: 0 })
  usageCount!: number

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @Column({
    name: "created_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  createdByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "created_by_staff_id" })
  createdBy!: Relation<User> | null

  /** Menu items this promo applies to (join table: promotion_items). */
  @ManyToMany(() => MenuItem, (m) => m.promotions)
  @JoinTable({
    name: "promotion_items",
    joinColumn: { name: "promotion_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "menu_item_id", referencedColumnName: "id" },
  })
  items!: Relation<MenuItem>[]

  @OneToMany(() => OrderPromotion, (p) => p.promotion)
  orderPromotions!: Relation<OrderPromotion>[]
}
