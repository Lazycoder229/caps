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
import {
  STOCK_ITEM_TYPE,
  STOCK_LOG_TYPE,
  type StockItemType,
  type StockLogType,
} from "./enums"
import { decimal } from "./transformers"
import { InventoryItem } from "./InventoryItem"
import { MenuItem } from "./MenuItem"
import { User } from "./User"

/**
 * item_type = 'ingredient' -> inventory_item_id is set, menu_item_id is NULL
 * item_type = 'menu_item'  -> menu_item_id is set, inventory_item_id is NULL
 */
@Entity("inventory_stock_logs")
@Index("inv_stock_logs_item_idx", ["inventoryItemId", "createdAt"])
@Index("inv_stock_logs_menu_idx", ["menuItemId", "createdAt"])
export class InventoryStockLog {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "item_type", type: "enum", enum: STOCK_ITEM_TYPE })
  itemType!: StockItemType

  @Column({
    name: "inventory_item_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  inventoryItemId!: string | null

  @Column({ name: "menu_item_id", type: "char", length: 36, nullable: true })
  menuItemId!: string | null

  @Column({ type: "enum", enum: STOCK_LOG_TYPE })
  type!: StockLogType

  @Column({
    name: "quantity_change",
    type: "decimal",
    precision: 10,
    scale: 3,
    transformer: decimal,
  })
  quantityChange!: number

  @Column({
    name: "quantity_after",
    type: "decimal",
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: decimal,
  })
  quantityAfter!: number | null

  @Column({ type: "varchar", length: 255, nullable: true })
  note!: string | null

  @Column({
    name: "performed_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  performedByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => InventoryItem, (i) => i.stockLogs, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: Relation<InventoryItem> | null

  @ManyToOne(() => MenuItem, (m) => m.stockLogs, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "menu_item_id" })
  menuItem!: Relation<MenuItem> | null

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "performed_by_staff_id" })
  performedBy!: Relation<User> | null
}
