import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from "typeorm"
import { Order } from "./Order"
import { LoyaltyTransaction } from "./LoyaltyTransaction"
import { Reservation } from "./Reservation"

@Entity("customers")
@Index("email", ["email"], { unique: true })
export class Customer {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null

  /**
   * bcrypt hash. NOT selected by default (select: false).
   * For login use: qb.addSelect('c.password')
   */
  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  password!: string | null

  @Column({ type: "varchar", length: 100 })
  name!: string

  @Column({
    name: "contact_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  contactNumber!: string | null

  @Column({
    name: "loyalty_points_balance",
    type: "int",
    unsigned: true,
    default: 0,
  })
  loyaltyPointsBalance!: number

  @Column({ name: "is_guest", type: "boolean", default: 1 })
  isGuest!: boolean

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  /** 'YYYY-MM-DD' */
  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth!: string | null

  @Column({
    name: "pwd_id_number",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  pwdIdNumber!: string | null

  @OneToMany(() => Order, (o) => o.customer)
  orders!: Relation<Order>[]

  @OneToMany(() => LoyaltyTransaction, (t) => t.customer)
  loyaltyTransactions!: Relation<LoyaltyTransaction>[]

  @OneToMany(() => Reservation, (r) => r.customer)
  reservations!: Relation<Reservation>[]
}
