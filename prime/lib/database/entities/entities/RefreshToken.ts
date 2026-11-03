import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

/**
 * user_id holds a users.id OR a customers.id (customers log in too),
 * so there is deliberately no FK / relation here.
 */
@Entity("refresh_tokens")
@Index("user_id_idx", ["userId"])
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id!: number

  @Column({ name: "user_id", type: "char", length: 36 })
  userId!: string

  /** Stored hashed. Not selected by default (select: false). */
  @Column({ type: "text", select: false })
  token!: string

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date

  /** `text` in the DB, so it cannot be indexed as-is. */
  @Column({ type: "text" })
  jti!: string
}
