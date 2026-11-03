import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { Role } from "./Role"
import { Employee } from "./Employee"

/** Staff accounts (admin, cashier, ...). Customers are in the separate `customers` table. */
@Entity("users")
@Index("email", ["email"], { unique: true })
@Index("users_role_idx", ["roleId"])
export class User {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "role_id", type: "char", length: 36 })
  roleId!: string

  @Column({ type: "varchar", length: 255 })
  email!: string

  /**
   * Salted scrypt hash. NOT selected by default (select: false).
   * For login use: repo.createQueryBuilder('u').addSelect('u.password').where('u.email = :email', { email })
   */
  @Column({ type: "varchar", length: 255, select: false })
  password!: string

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({
    name: "contact_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  contactNumber!: string | null

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @Column({ name: "last_login_at", type: "timestamp", nullable: true })
  lastLoginAt!: Date | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  @ManyToOne(() => Role, (r) => r.users, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "role_id" })
  role!: Relation<Role>

  /** Set only if this user is also an employee (HR record). */
  @OneToOne(() => Employee, (e) => e.user)
  employee!: Relation<Employee> | null
}
