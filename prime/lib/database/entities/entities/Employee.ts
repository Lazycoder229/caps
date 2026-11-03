import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import {
  EMPLOYMENT_STATUS,
  SALARY_TYPE,
  type EmploymentStatus,
  type SalaryType,
} from "./enums"
import { decimal } from "./transformers"
import { User } from "./User"
import { AttendanceLog } from "./AttendanceLog"
import { PayrollRecord } from "./PayrollRecord"

@Entity("employees")
@Index("user_id", ["userId"], { unique: true })
@Index("employee_number", ["employeeNumber"], { unique: true })
@Index("rfid_card_uid", ["rfidCardUid"], { unique: true })
export class Employee {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "user_id", type: "char", length: 36 })
  userId!: string

  @Column({ name: "employee_number", type: "varchar", length: 20 })
  employeeNumber!: string

  @Column({ type: "varchar", length: 100 })
  position!: string

  @Column({ type: "varchar", length: 100, nullable: true })
  department!: string | null

  @Column({
    name: "rfid_card_uid",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  rfidCardUid!: string | null

  /** 'YYYY-MM-DD' */
  @Column({ name: "date_hired", type: "date" })
  dateHired!: string

  @Column({ name: "date_terminated", type: "date", nullable: true })
  dateTerminated!: string | null

  @Column({
    name: "employment_status",
    type: "enum",
    enum: EMPLOYMENT_STATUS,
    default: "active",
  })
  employmentStatus!: EmploymentStatus

  @Column({
    name: "basic_salary",
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  basicSalary!: number

  @Column({ name: "salary_type", type: "enum", enum: SALARY_TYPE })
  salaryType!: SalaryType

  @Column({
    name: "sss_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  sssEmployeeShare!: number

  @Column({
    name: "sss_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  sssEmployerShare!: number

  @Column({
    name: "philhealth_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  philhealthEmployeeShare!: number

  @Column({
    name: "philhealth_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  philhealthEmployerShare!: number

  @Column({
    name: "pagibig_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  pagibigEmployeeShare!: number

  @Column({
    name: "pagibig_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  pagibigEmployerShare!: number

  @OneToOne(() => User, (u) => u.employee, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>

  @OneToMany(() => AttendanceLog, (a) => a.employee)
  attendanceLogs!: Relation<AttendanceLog>[]

  @OneToMany(() => PayrollRecord, (p) => p.employee)
  payrollRecords!: Relation<PayrollRecord>[]
}
