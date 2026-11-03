import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { Order } from "./Order"
import { MenuItem } from "./MenuItem"

@Entity("order_items")
@Index("order_items_order_id_idx", ["orderId"])
export class OrderItem {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "order_id", type: "char", length: 36 })
  orderId!: string

  @Column({ name: "menu_item_id", type: "char", length: 36 })
  menuItemId!: string

  @Column({ type: "int", unsigned: true })
  quantity!: number

  /** Price at the time of the order (snapshot, not the current menu price). */
  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  unitPrice!: number

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  subtotal!: number

  @Column({ type: "varchar", length: 255, nullable: true })
  notes!: string | null

  @ManyToOne(() => Order, (o) => o.items, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>

  @ManyToOne(() => MenuItem, (m) => m.orderItems, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "menu_item_id" })
  menuItem!: Relation<MenuItem>
}
