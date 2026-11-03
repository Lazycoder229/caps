import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { Category } from "./Category"
import { MenuItemIngredient } from "./MenuItemIngredient"
import { OrderItem } from "./OrderItem"
import { InventoryStockLog } from "./InventoryStockLog"
import { Promotion } from "./Promotion"

@Entity("menu_items")
@Index("menu_items_category_idx", ["categoryId"])
@Index("menu_items_is_available_idx", ["isAvailable"])
export class MenuItem {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "category_id", type: "char", length: 36 })
  categoryId!: string

  @Column({ type: "varchar", length: 150 })
  name!: string

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  price!: number

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null

  @Column({ name: "is_available", type: "boolean", default: 1 })
  isAvailable!: boolean

  /** NULL = stock is not tracked for this item (e.g. rice). */
  @Column({
    name: "stock_quantity",
    type: "int",
    unsigned: true,
    nullable: true,
  })
  stockQuantity!: number | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  @ManyToOne(() => Category, (c) => c.menuItems, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category!: Relation<Category>

  @OneToMany(() => MenuItemIngredient, (i) => i.menuItem)
  ingredients!: Relation<MenuItemIngredient>[]

  @OneToMany(() => OrderItem, (i) => i.menuItem)
  orderItems!: Relation<OrderItem>[]

  @OneToMany(() => InventoryStockLog, (l) => l.menuItem)
  stockLogs!: Relation<InventoryStockLog>[]

  /** Join table: promotion_items (owned by Promotion). */
  @ManyToMany(() => Promotion, (p) => p.items)
  promotions!: Relation<Promotion>[]
}
