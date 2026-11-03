import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { OrderDiscount } from "./OrderDiscount"

@Entity("discount_types")
export class DiscountType {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({ type: "decimal", precision: 5, scale: 2, transformer: decimal })
  percentage!: number

  @Column({ name: "requires_id_verification", type: "boolean", default: 1 })
  requiresIdVerification!: boolean

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @OneToMany(() => OrderDiscount, (d) => d.discountType)
  orderDiscounts!: Relation<OrderDiscount>[]
}
