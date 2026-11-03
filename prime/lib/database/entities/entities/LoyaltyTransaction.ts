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
import { LOYALTY_TX_TYPE, type LoyaltyTxType } from "./enums"
import { Customer } from "./Customer"
import { Order } from "./Order"
import { LoyaltyReward } from "./LoyaltyReward"

@Entity("loyalty_transactions")
@Index("loyalty_tx_customer_idx", ["customerId"])
export class LoyaltyTransaction {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "customer_id", type: "char", length: 36 })
  customerId!: string

  @Column({ name: "order_id", type: "char", length: 36, nullable: true })
  orderId!: string | null

  @Column({ type: "enum", enum: LOYALTY_TX_TYPE })
  type!: LoyaltyTxType

  /** Positive for 'earn', negative for 'redeem'. */
  @Column({ type: "int" })
  points!: number

  @Column({ name: "balance_after", type: "int", unsigned: true })
  balanceAfter!: number

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "reward_id", type: "char", length: 36, nullable: true })
  rewardId!: string | null

  /** Snapshot of the reward name at redemption time. */
  @Column({ name: "reward_name", type: "varchar", length: 150, nullable: true })
  rewardName!: string | null

  @ManyToOne(() => Customer, (c) => c.loyaltyTransactions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Relation<Customer>

  @ManyToOne(() => Order, (o) => o.loyaltyTransactions, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order> | null

  /** reward_id has NO foreign key in the DB, so this relation is read-only convenience. */
  @ManyToOne(() => LoyaltyReward, (r) => r.transactions, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "reward_id" })
  reward!: Relation<LoyaltyReward> | null
}
