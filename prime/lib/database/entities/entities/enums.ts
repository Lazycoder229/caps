/**
 * Enum values, mirrored from the MySQL ENUM columns.
 * Reuse the same arrays in zod so DB, entity and validation never drift apart:
 *   z.enum(ATTENDANCE_STATUS)
 */

export const ATTENDANCE_STATUS = [
  "on_time",
  "late",
  "overtime",
  "incomplete",
  "absent",
] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number]

export const ATTENDANCE_METHOD = ["rfid", "manual", "pin"] as const
export type AttendanceMethod = (typeof ATTENDANCE_METHOD)[number]

export const EMPLOYMENT_STATUS = ["active", "on_leave", "terminated"] as const
export type EmploymentStatus = (typeof EMPLOYMENT_STATUS)[number]

export const SALARY_TYPE = ["daily", "monthly"] as const
export type SalaryType = (typeof SALARY_TYPE)[number]

export const STOCK_ITEM_TYPE = ["ingredient", "menu_item"] as const
export type StockItemType = (typeof STOCK_ITEM_TYPE)[number]

export const STOCK_LOG_TYPE = [
  "stock_in",
  "adjustment",
  "waste",
  "consumed",
] as const
export type StockLogType = (typeof STOCK_LOG_TYPE)[number]

export const LOYALTY_TX_TYPE = ["earn", "redeem"] as const
export type LoyaltyTxType = (typeof LOYALTY_TX_TYPE)[number]

export const ORDER_TYPE = ["qr", "counter", "delivery"] as const
export type OrderType = (typeof ORDER_TYPE)[number]

export const ORDER_STATUS = [
  "pending",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
] as const
export type OrderStatus = (typeof ORDER_STATUS)[number]

export const VOID_STATUS = ["pending", "approved", "rejected"] as const
export type VoidStatus = (typeof VOID_STATUS)[number]

export const PAYMENT_METHOD = [
  "cash",
  "gcash",
  "maya",
  "qrph",
  "card",
  "other",
] as const
export type PaymentMethod = (typeof PAYMENT_METHOD)[number]

export const PAYROLL_PERIOD_STATUS = ["open", "processing", "closed"] as const
export type PayrollPeriodStatus = (typeof PAYROLL_PERIOD_STATUS)[number]

export const PRINTER_LOCATION = ["kitchen", "counter"] as const
export type PrinterLocation = (typeof PRINTER_LOCATION)[number]

export const PRINTER_CONNECTION = ["network", "usb", "bluetooth"] as const
export type PrinterConnection = (typeof PRINTER_CONNECTION)[number]

export const PROMO_TYPE = ["percentage", "fixed_amount", "buy_x_get_y"] as const
export type PromoType = (typeof PROMO_TYPE)[number]

export const RESERVATION_STATUS = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const
export type ReservationStatus = (typeof RESERVATION_STATUS)[number]

export const TABLE_STATUS = ["available", "occupied", "reserved"] as const
export type TableStatus = (typeof TABLE_STATUS)[number]
