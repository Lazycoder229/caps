import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { Expense } from "./Expense"

@Entity("expense_categories")
@Index("name", ["name"], { unique: true })
export class ExpenseCategory {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @OneToMany(() => Expense, (e) => e.category)
  expenses!: Relation<Expense>[]
}
