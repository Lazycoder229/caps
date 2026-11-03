import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

/**
 * Polymorphic: account_type says whether account_id is a users.id or a customers.id,
 * so there is no real FK. created_at has no DB default: set it in code.
 */
@Entity("password_reset_tokens")
@Index("token_hash_unique", ["tokenHash"], { unique: true })
@Index("password_reset_account_idx", ["accountType", "accountId"])
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id!: number

  /** e.g. 'user' | 'customer' */
  @Column({ name: "account_type", type: "varchar", length: 16 })
  accountType!: string

  @Column({ name: "account_id", type: "char", length: 36 })
  accountId!: string

  /** sha-256 hex of the emailed token. Never store the raw token. */
  @Column({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt!: Date | null

  @Column({ name: "created_at", type: "datetime" })
  createdAt!: Date
}
