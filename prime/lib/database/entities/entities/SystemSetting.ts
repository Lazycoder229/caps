import { Column, Entity, PrimaryColumn } from "typeorm"
import { decimal } from "./transformers"

/** Single-row table: restaurant-wide POS settings. */
@Entity("system_settings")
export class SystemSetting {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({
    name: "restaurant_name",
    type: "varchar",
    length: 150,
    default: "PRIME Roast & Grill",
  })
  restaurantName!: string

  @Column({
    name: "branch_name",
    type: "varchar",
    length: 100,
    default: "Main Branch - Manila",
  })
  branchName!: string

  @Column({
    name: "contact_number",
    type: "varchar",
    length: 50,
    default: "+63 917 123 4567",
  })
  contactNumber!: string

  @Column({
    type: "varchar",
    length: 100,
    default: "contact@primerestaurant.ph",
  })
  email!: string

  @Column({ type: "text" })
  address!: string

  @Column({ name: "delivery_enabled", type: "boolean", default: 1 })
  deliveryEnabled!: boolean

  @Column({ name: "delivery_fee", type: "decimal", precision: 10, scale: 2, default: 49, transformer: decimal })
  deliveryFee!: number

  @Column({ name: "delivery_minimum_order", type: "decimal", precision: 10, scale: 2, default: 0, transformer: decimal })
  deliveryMinimumOrder!: number

  @Column({ name: "tin_number", type: "varchar", length: 50, nullable: true })
  tinNumber!: string | null

  @Column({ name: "bir_min", type: "varchar", length: 50, nullable: true })
  birMin!: string | null

  @Column({
    name: "currency_symbol",
    type: "varchar",
    length: 10,
    default: "₱",
  })
  currencySymbol!: string

  @Column({
    name: "currency_code",
    type: "varchar",
    length: 10,
    default: "PHP",
  })
  currencyCode!: string

  @Column({ type: "varchar", length: 50, default: "Asia/Manila" })
  timezone!: string

  @Column({ name: "vat_enabled", type: "boolean", default: 1 })
  vatEnabled!: boolean

  @Column({
    name: "vat_rate",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 12,
    transformer: decimal,
  })
  vatRate!: number

  @Column({ name: "vat_inclusive", type: "boolean", default: 1 })
  vatInclusive!: boolean

  @Column({ name: "service_charge_enabled", type: "boolean", default: 0 })
  serviceChargeEnabled!: boolean

  @Column({
    name: "service_charge_rate",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 5,
    transformer: decimal,
  })
  serviceChargeRate!: number

  @Column({ name: "senior_pwd_discount_enabled", type: "boolean", default: 1 })
  seniorPwdDiscountEnabled!: boolean

  @Column({ name: "payment_cash_enabled", type: "boolean", default: 1 })
  paymentCashEnabled!: boolean

  @Column({ name: "payment_gcash_enabled", type: "boolean", default: 1 })
  paymentGcashEnabled!: boolean

  @Column({ name: "payment_maya_enabled", type: "boolean", default: 1 })
  paymentMayaEnabled!: boolean

  @Column({ name: "payment_qrph_enabled", type: "boolean", default: 1 })
  paymentQrphEnabled!: boolean

  @Column({
    name: "order_number_prefix",
    type: "varchar",
    length: 20,
    default: "ORD-",
  })
  orderNumberPrefix!: string

  @Column({ name: "auto_accept_qr_orders", type: "boolean", default: 0 })
  autoAcceptQrOrders!: boolean

  @Column({ name: "require_table_selection", type: "boolean", default: 1 })
  requireTableSelection!: boolean

  @Column({ name: "manager_approval_for_voids", type: "boolean", default: 1 })
  managerApprovalForVoids!: boolean

  @Column({
    name: "low_stock_threshold_alert",
    type: "int",
    unsigned: true,
    default: 10,
  })
  lowStockThresholdAlert!: number

  @Column({ name: "receipt_header", type: "text", nullable: true })
  receiptHeader!: string | null

  @Column({ name: "receipt_footer", type: "text", nullable: true })
  receiptFooter!: string | null

  @Column({ name: "print_receipt_auto", type: "boolean", default: 1 })
  printReceiptAuto!: boolean

  @Column({ name: "print_kot_auto", type: "boolean", default: 1 })
  printKotAuto!: boolean

  @Column({ name: "show_wifi_on_receipt", type: "boolean", default: 1 })
  showWifiOnReceipt!: boolean

  @Column({ name: "wifi_ssid", type: "varchar", length: 100, nullable: true })
  wifiSsid!: string | null

  @Column({
    name: "wifi_password",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  wifiPassword!: string | null

  /** 'HH:mm' stored as text */
  @Column({
    name: "opening_time",
    type: "varchar",
    length: 10,
    default: "08:00",
  })
  openingTime!: string

  /** 'HH:mm' stored as text */
  @Column({
    name: "closing_time",
    type: "varchar",
    length: 10,
    default: "22:00",
  })
  closingTime!: string

  @Column({
    name: "cash_drawer_opening_balance_required",
    type: "boolean",
    default: 1,
  })
  cashDrawerOpeningBalanceRequired!: boolean

  @Column({
    name: "payroll_duty_hours",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 8,
    transformer: decimal,
  })
  payrollDutyHours!: number

  @Column({
    name: "payroll_unpaid_break_hours",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 1,
    transformer: decimal,
  })
  payrollUnpaidBreakHours!: number

  @Column({
    name: "payroll_workdays_per_month",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 26,
    transformer: decimal,
  })
  payrollWorkdaysPerMonth!: number

  @Column({
    name: "payroll_overtime_multiplier",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 1.25,
    transformer: decimal,
  })
  payrollOvertimeMultiplier!: number

  @Column({
    name: "payroll_sss_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  payrollSssEmployeeShare!: number

  @Column({
    name: "payroll_sss_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 255,
    transformer: decimal,
  })
  payrollSssEmployerShare!: number

  @Column({
    name: "payroll_philhealth_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  payrollPhilhealthEmployeeShare!: number

  @Column({
    name: "payroll_philhealth_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 125,
    transformer: decimal,
  })
  payrollPhilhealthEmployerShare!: number

  @Column({
    name: "payroll_pagibig_employee_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  payrollPagibigEmployeeShare!: number

  @Column({
    name: "payroll_pagibig_employer_share",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 4.5,
    transformer: decimal,
  })
  payrollPagibigEmployerShare!: number

  @Column({
    name: "payroll_meals_deduction",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimal,
  })
  payrollMealsDeduction!: number

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null

  /**
   * Base64 data-URL images (hundreds of KB each). select: false so a normal
   * settings read stays small. Load on demand: qb.addSelect('s.gcashQrImage')
   */
  @Column({
    name: "gcash_qr_image",
    type: "longtext",
    nullable: true,
    select: false,
  })
  gcashQrImage!: string | null

  @Column({
    name: "maya_qr_image",
    type: "longtext",
    nullable: true,
    select: false,
  })
  mayaQrImage!: string | null

  @Column({
    name: "qrph_qr_image",
    type: "longtext",
    nullable: true,
    select: false,
  })
  qrphQrImage!: string | null
}
