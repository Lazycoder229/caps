import { Column, Entity, Index, PrimaryColumn } from "typeorm"
import { decimal } from "./transformers"

export const CUSTOMER_DELIVERY_ADDRESS_LABELS = ["home", "work"] as const
export type CustomerDeliveryAddressLabel = (typeof CUSTOMER_DELIVERY_ADDRESS_LABELS)[number]

@Entity("customer_delivery_addresses")
@Index("customer_delivery_addresses_default_idx", ["customerId", "isDefault"])
export class CustomerDeliveryAddress {
  @PrimaryColumn({ name: "customer_id", type: "char", length: 36 })
  customerId!: string

  @PrimaryColumn({ type: "enum", enum: CUSTOMER_DELIVERY_ADDRESS_LABELS })
  label!: CustomerDeliveryAddressLabel

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string

  @Column({ name: "contact_number", type: "varchar", length: 20 })
  contactNumber!: string

  @Column({ type: "text" })
  address!: string

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true, transformer: decimal })
  latitude!: number | null

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true, transformer: decimal })
  longitude!: number | null

  @Column({ type: "text", nullable: true })
  instructions!: string | null

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean
}
