import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { MenuItem } from "./MenuItem"

@Entity("categories")
export class Category {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @OneToMany(() => MenuItem, (m) => m.category)
  menuItems!: Relation<MenuItem>[]
}
