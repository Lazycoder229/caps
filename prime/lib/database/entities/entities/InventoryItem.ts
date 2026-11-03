import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { InventoryCategory } from "./InventoryCategory"
import { MenuItemIngredient } from "./MenuItemIngredient"
import { InventoryStockLog } from "./InventoryStockLog"

@Entity("inventory_items")
@Index("inventory_cat_active_idx", ["categoryId", "isActive"])
export class InventoryItem {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "category_id", type: "char", length: 36, nullable: true })
  categoryId!: string | null

  @Column({ type: "varchar", length: 150 })
  name!: string

  @Column({ type: "varchar", length: 30 })
  unit!: string

  @Column({
    name: "stock_quantity",
    type: "decimal",
    precision: 10,
    scale: 3,
    default: 0,
    transformer: decimal,
  })
  stockQuantity!: number

  @Column({
    name: "reorder_threshold",
    type: "decimal",
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: decimal,
  })
  reorderThreshold!: number | null

  @Column({
    name: "unit_cost",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  unitCost!: number | null

  @Column({ type: "varchar", length: 150, nullable: true })
  supplier!: string | null

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  @ManyToOne(() => InventoryCategory, (c) => c.items, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category!: Relation<InventoryCategory> | null

  @OneToMany(() => MenuItemIngredient, (i) => i.inventoryItem)
  usedIn!: Relation<MenuItemIngredient>[]

  @OneToMany(() => InventoryStockLog, (l) => l.inventoryItem)
  stockLogs!: Relation<InventoryStockLog>[]
}
