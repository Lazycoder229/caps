import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { Permission } from "./Permission"
import { User } from "./User"

@Entity("roles")
@Index("name", ["name"], { unique: true })
export class Role {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 50 })
  name!: string

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ name: "is_system", type: "boolean", default: 0 })
  isSystem!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  /** Join table: role_permissions (composite PK role_id + permission_id). */
  @ManyToMany(() => Permission, (p) => p.roles)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions!: Relation<Permission>[]

  @OneToMany(() => User, (u) => u.role)
  users!: Relation<User>[]
}
