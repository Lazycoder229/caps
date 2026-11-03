import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"
import type { BranchType } from "../branch-types"

@Entity("branches")
@Index("code", ["code"], { unique: true })
export class Branch {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 120 })
  name!: string

  @Column({ type: "varchar", length: 30 })
  code!: string

  @Column({ type: "varchar", length: 20, default: "branch" })
  type!: BranchType

  @Column({ type: "text", nullable: true })
  address!: string | null

  @Column({
    name: "contact_number",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  contactNumber!: string | null

  @Column({ type: "varchar", length: 120, nullable: true })
  email!: string | null

  @Column({ name: "is_main", type: "boolean", default: 0 })
  isMain!: boolean

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null
}
