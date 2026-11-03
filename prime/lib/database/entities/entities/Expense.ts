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
import { decimal } from "./transformers"
import { ExpenseCategory } from "./ExpenseCategory"
import { User } from "./User"

@Entity("expenses")
@Index("expenses_cat_date_idx", ["categoryId", "expenseDate"])
export class Expense {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "category_id", type: "char", length: 36 })
  categoryId!: string

  @Column({ type: "varchar", length: 255 })
  description!: string

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  amount!: number

  /** 'YYYY-MM-DD' */
  @Column({ name: "expense_date", type: "date" })
  expenseDate!: string

  @Column({
    name: "receipt_reference",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  receiptReference!: string | null

  @Column({ type: "text", nullable: true })
  notes!: string | null

  @Column({ name: "recorded_by_staff_id", type: "char", length: 36 })
  recordedByStaffId!: string

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  @ManyToOne(() => ExpenseCategory, (c) => c.expenses, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category!: Relation<ExpenseCategory>

  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "recorded_by_staff_id" })
  recordedBy!: Relation<User>
}
