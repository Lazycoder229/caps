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
import { MenuItem } from "./MenuItem"
import { InventoryItem } from "./InventoryItem"

/** Recipe line: how much of an inventory item one menu item uses. Composite PK. */
@Entity("menu_item_ingredients")
@Index("menu_ingredients_inv_idx", ["inventoryItemId"])
export class MenuItemIngredient {
  @PrimaryColumn({ name: "menu_item_id", type: "char", length: 36 })
  menuItemId!: string

  @PrimaryColumn({ name: "inventory_item_id", type: "char", length: 36 })
  inventoryItemId!: string

  @Column({
    name: "quantity_used",
    type: "decimal",
    precision: 10,
    scale: 3,
    transformer: decimal,
  })
  quantityUsed!: number

  @ManyToOne(() => MenuItem, (m) => m.ingredients, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "menu_item_id" })
  menuItem!: Relation<MenuItem>

  @ManyToOne(() => InventoryItem, (i) => i.usedIn, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: Relation<InventoryItem>
}
