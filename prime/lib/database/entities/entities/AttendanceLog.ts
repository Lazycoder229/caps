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
import {
  ATTENDANCE_METHOD,
  ATTENDANCE_STATUS,
  type AttendanceMethod,
  type AttendanceStatus,
} from "./enums"
import { decimal } from "./transformers"
import { Employee } from "./Employee"

@Entity("attendance_logs")
@Index("att_logs_employee_idx", ["employeeId"])
export class AttendanceLog {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "employee_id", type: "char", length: 36 })
  employeeId!: string

  /** 'YYYY-MM-DD' (Manila date of the shift) */
  @Column({ name: "log_date", type: "date" })
  logDate!: string

  /** NULL for 'absent' rows. */
  @Column({ name: "clock_in", type: "timestamp", nullable: true })
  clockIn!: Date | null

  @Column({ name: "clock_out", type: "timestamp", nullable: true })
  clockOut!: Date | null

  @Column({
    name: "total_hours",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  totalHours!: number | null

  @Column({ name: "late_minutes", type: "int", unsigned: true, default: 0 })
  lateMinutes!: number

  @Column({
    name: "overtime_hours",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  overtimeHours!: number

  @Column({ type: "enum", enum: ATTENDANCE_STATUS, default: "on_time" })
  status!: AttendanceStatus

  @Column({ type: "enum", enum: ATTENDANCE_METHOD, default: "rfid" })
  method!: AttendanceMethod

  @Column({
    name: "rfid_card_uid_used",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  rfidCardUidUsed!: string | null

  @Column({ type: "text", nullable: true })
  notes!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => Employee, (e) => e.attendanceLogs, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "employee_id" })
  employee!: Relation<Employee>
}
