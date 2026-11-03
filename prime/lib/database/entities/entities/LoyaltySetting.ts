import { Column, Entity, PrimaryColumn } from "typeorm"
import { decimal } from "./transformers"

/** Single-row settings table. */
@Entity("loyalty_settings")
export class LoyaltySetting {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  // Keep the existing database column name so deployed databases work even
  // before the settings migration is applied; the value now means tier points.
  @Column({
    name: "points_per_peso",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 5,
    transformer: decimal,
  })
  pointsPerTier!: number

  @Column({
    name: "peso_value_per_point",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.25,
    transformer: decimal,
  })
  pesoValuePerPoint!: number

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null
}
