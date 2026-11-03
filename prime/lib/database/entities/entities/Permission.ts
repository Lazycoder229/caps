import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { Role } from "./Role"

@Entity("permissions")
@Index("code", ["code"], { unique: true })
export class Permission {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  /** e.g. 'orders:create', 'voids:approve' */
  @Column({ type: "varchar", length: 100 })
  code!: string

  @Column({ type: "varchar", length: 50 })
  module!: string

  @Column({ type: "text", nullable: true })
  description!: string | null

  /** Join table: role_permissions (owned by Role). */
  @ManyToMany(() => Role, (r) => r.permissions)
  roles!: Relation<Role>[]
}
