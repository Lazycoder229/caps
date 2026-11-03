import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { PAYROLL_PERIOD_STATUS, type PayrollPeriodStatus } from "./enums"
import { PayrollRecord } from "./PayrollRecord"

@Entity("payroll_periods")
export class PayrollPeriod {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  /** 'YYYY-MM-DD' */
  @Column({ name: "period_start", type: "date" })
  periodStart!: string

  /** 'YYYY-MM-DD' */
  @Column({ name: "period_end", type: "date" })
  periodEnd!: string

  @Column({ type: "enum", enum: PAYROLL_PERIOD_STATUS, default: "open" })
  status!: PayrollPeriodStatus

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @OneToMany(() => PayrollRecord, (r) => r.payrollPeriod)
  records!: Relation<PayrollRecord>[]
}
