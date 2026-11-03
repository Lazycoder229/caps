import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { LoyaltyTransaction } from "./LoyaltyTransaction"

@Entity("loyalty_rewards")
export class LoyaltyReward {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 150 })
  name!: string

  @Column({ name: "points_cost", type: "int", unsigned: true })
  pointsCost!: number

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ name: "is_active", type: "boolean", default: 1 })
  isActive!: boolean

  @OneToMany(() => LoyaltyTransaction, (t) => t.reward)
  transactions!: Relation<LoyaltyTransaction>[]
}
