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

@Entity("audit_logs")
@Index("audit_logs_user_idx", ["userId"])
@Index("audit_logs_entity_idx", ["entityType", "entityId"])
export class AuditLog {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "user_id", type: "char", length: 36, nullable: true })
  userId!: string | null

  @Column({ type: "varchar", length: 100 })
  action!: string

  /** Polymorphic: e.g. 'order', 'menu_item'. No real FK on entity_id. */
  @Column({ name: "entity_type", type: "varchar", length: 50 })
  entityType!: string

  @Column({ name: "entity_id", type: "char", length: 36 })
  entityId!: string

  @Column({ type: "json", nullable: true })
  details!: Record<string, unknown> | null

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User> | null
}
