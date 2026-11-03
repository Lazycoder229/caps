import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"

@Entity("staff_sessions")
@Index("staff_sessions_user_idx", ["userId"])
@Index("staff_sessions_expires_idx", ["expiresAt"])
export class StaffSession {
  /** SHA-256 of an opaque browser token. The raw token stays in an HttpOnly cookie. */
  @PrimaryColumn({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string

  @Column({ name: "user_id", type: "char", length: 36 })
  userId!: string

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date
}
