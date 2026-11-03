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
import { Employee } from "./Employee"
import { PayrollPeriod } from "./PayrollPeriod"
import { PayrollDeduction } from "./PayrollDeduction"
import { User } from "./User"

@Entity("payroll_records")
@Index("payroll_rec_emp_period_idx", ["employeeId", "payrollPeriodId"])
export class PayrollRecord {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "employee_id", type: "char", length: 36 })
  employeeId!: string

  @Column({ name: "payroll_period_id", type: "char", length: 36 })
  payrollPeriodId!: string

  @Column({
    name: "gross_pay",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  grossPay!: number

  @Column({
    name: "daily_rate",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  dailyRate!: number

  @Column({
    name: "total_deductions",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  totalDeductions!: number

  @Column({
    name: "net_pay",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  netPay!: number

  @Column({
    name: "paid_hours",
    type: "decimal",
    precision: 7,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  paidHours!: number

  @Column({
    name: "overtime_hours",
    type: "decimal",
    precision: 7,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  overtimeHours!: number

  @Column({
    name: "attendance_days",
    type: "decimal",
    precision: 6,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  attendanceDays!: number

  @Column({
    name: "processed_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  processedByStaffId!: string | null

  @CreateDateColumn({ name: "processed_at", type: "timestamp" })
  processedAt!: Date

  @ManyToOne(() => Employee, (e) => e.payrollRecords, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "employee_id" })
  employee!: Relation<Employee>

  @ManyToOne(() => PayrollPeriod, (p) => p.records, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "payroll_period_id" })
  payrollPeriod!: Relation<PayrollPeriod>

  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "processed_by_staff_id" })
  processedBy!: Relation<User> | null

  @OneToMany(() => PayrollDeduction, (d) => d.payrollRecord)
  deductions!: Relation<PayrollDeduction>[]
}
