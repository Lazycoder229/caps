import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"

@Entity("customer_sessions")
@Index("customer_sessions_customer_idx", ["customerId"])
@Index("customer_sessions_expires_idx", ["expiresAt"])
export class CustomerSession {
  /** SHA-256 of the opaque browser token. The raw token only lives in an HttpOnly cookie. */
  @PrimaryColumn({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string

  @Column({ name: "customer_id", type: "char", length: 36 })
  customerId!: string

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date
}
