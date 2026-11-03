import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { PayrollDeduction } from "./PayrollDeduction"

@Entity("deduction_types")
@Index("deduction_types_code_uq", ["code"], { unique: true })
export class DeductionType {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({ type: "varchar", length: 30, nullable: true })
  code!: string | null

  @Column({ name: "is_mandatory", type: "boolean", default: 0 })
  isMandatory!: boolean

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @OneToMany(() => PayrollDeduction, (d) => d.deductionType)
  payrollDeductions!: Relation<PayrollDeduction>[]
}
