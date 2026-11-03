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
import { User } from "./User"

/** Linked to users.id (NOT employees.id). Go through employees.user_id to find an employee's shifts. */
@Entity("employee_schedules")
export class EmployeeSchedule {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "user_id", type: "char", length: 36 })
  userId!: string

  /** 'YYYY-MM-DD' */
  @Column({ name: "shift_date", type: "date" })
  shiftDate!: string

  /** 'HH:mm:ss' */
  @Column({ name: "start_time", type: "time" })
  startTime!: string

  /** 'HH:mm:ss'. If end <= start the shift is overnight. */
  @Column({ name: "end_time", type: "time" })
  endTime!: string

  @Column({
    name: "created_by_staff_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  createdByStaffId!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "created_by_staff_id" })
  createdBy!: Relation<User> | null
}
