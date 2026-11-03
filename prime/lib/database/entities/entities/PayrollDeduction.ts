import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { decimal } from "./transformers"
import { PayrollRecord } from "./PayrollRecord"
import { DeductionType } from "./DeductionType"

@Entity("payroll_deductions")
export class PayrollDeduction {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "payroll_record_id", type: "char", length: 36 })
  payrollRecordId!: string

  @Column({ name: "deduction_type_id", type: "char", length: 36 })
  deductionTypeId!: string

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimal })
  amount!: number

  @Column({
    name: "employer_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  employerAmount!: number

  @Column({
    name: "deduction_name",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  deductionName!: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  notes!: string | null

  @ManyToOne(() => PayrollRecord, (r) => r.deductions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "payroll_record_id" })
  payrollRecord!: Relation<PayrollRecord>

  @ManyToOne(() => DeductionType, (t) => t.payrollDeductions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "deduction_type_id" })
  deductionType!: Relation<DeductionType>
}
