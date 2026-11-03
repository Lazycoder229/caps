import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { InventoryItem } from "./InventoryItem"

@Entity("inventory_categories")
export class InventoryCategory {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @OneToMany(() => InventoryItem, (i) => i.category)
  items!: Relation<InventoryItem>[]
}
