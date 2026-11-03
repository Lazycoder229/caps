import { AppMigration } from "./AppMigration"
import { AttendanceLog } from "./AttendanceLog"
import { AuditLog } from "./AuditLog"
import { Branch } from "./Branch"
import { Category } from "./Category"
import { Customer } from "./Customer"
import { CustomerDeliveryAddress } from "./CustomerDeliveryAddress"
import { CustomerSession } from "./CustomerSession"
import { DeductionType } from "./DeductionType"
import { Delivery } from "./Delivery"
import { DiscountType } from "./DiscountType"
import { Employee } from "./Employee"
import { EmployeeSchedule } from "./EmployeeSchedule"
import { Expense } from "./Expense"
import { ExpenseCategory } from "./ExpenseCategory"
import { InventoryCategory } from "./InventoryCategory"
import { InventoryItem } from "./InventoryItem"
import { InventoryStockLog } from "./InventoryStockLog"
import { LoyaltyReward } from "./LoyaltyReward"
import { LoyaltySetting } from "./LoyaltySetting"
import { LoyaltyTransaction } from "./LoyaltyTransaction"
import { MenuItem } from "./MenuItem"
import { MenuItemIngredient } from "./MenuItemIngredient"
import { Order } from "./Order"
import { OrderDiscount } from "./OrderDiscount"
import { OrderItem } from "./OrderItem"
import { OrderPromotion } from "./OrderPromotion"
import { OrderStatusHistory } from "./OrderStatusHistory"
import { OrderVoid } from "./OrderVoid"
import { PasswordResetToken } from "./PasswordResetToken"
import { Payment } from "./Payment"
import { PayrollDeduction } from "./PayrollDeduction"
import { PayrollPeriod } from "./PayrollPeriod"
import { PayrollRecord } from "./PayrollRecord"
import { Permission } from "./Permission"
import { Printer } from "./Printer"
import { Promotion } from "./Promotion"
import { RefreshToken } from "./RefreshToken"
import { Reservation } from "./Reservation"
import { RestaurantTable } from "./RestaurantTable"
import { Role } from "./Role"
import { SystemSetting } from "./SystemSetting"
import { StaffSession } from "./StaffSession"
import { User } from "./User"

export * from "./enums"
export * from "./transformers"

export {
  AppMigration,
  AttendanceLog,
  AuditLog,
  Branch,
  Category,
  Customer,
  CustomerDeliveryAddress,
  CustomerSession,
  DeductionType,
  Delivery,
  DiscountType,
  Employee,
  EmployeeSchedule,
  Expense,
  ExpenseCategory,
  InventoryCategory,
  InventoryItem,
  InventoryStockLog,
  LoyaltyReward,
  LoyaltySetting,
  LoyaltyTransaction,
  MenuItem,
  MenuItemIngredient,
  Order,
  OrderDiscount,
  OrderItem,
  OrderPromotion,
  OrderStatusHistory,
  OrderVoid,
  PasswordResetToken,
  Payment,
  PayrollDeduction,
  PayrollPeriod,
  PayrollRecord,
  Permission,
  Printer,
  Promotion,
  RefreshToken,
  Reservation,
  RestaurantTable,
  Role,
  SystemSetting,
  StaffSession,
  User,
}

/**
 * Pass this array to the DataSource (`entities`). Importing the classes explicitly
 * is more reliable in Next.js than glob paths, which break once the code is bundled.
 * role_permissions and promotion_items are join tables created from the @ManyToMany
 * relations, so they have no class of their own.
 */
export const entities = [
  AppMigration,
  AttendanceLog,
  AuditLog,
  Branch,
  Category,
  Customer,
  CustomerDeliveryAddress,
  CustomerSession,
  DeductionType,
  Delivery,
  DiscountType,
  Employee,
  EmployeeSchedule,
  Expense,
  ExpenseCategory,
  InventoryCategory,
  InventoryItem,
  InventoryStockLog,
  LoyaltyReward,
  LoyaltySetting,
  LoyaltyTransaction,
  MenuItem,
  MenuItemIngredient,
  Order,
  OrderDiscount,
  OrderItem,
  OrderPromotion,
  OrderStatusHistory,
  OrderVoid,
  PasswordResetToken,
  Payment,
  PayrollDeduction,
  PayrollPeriod,
  PayrollRecord,
  Permission,
  Printer,
  Promotion,
  RefreshToken,
  Reservation,
  RestaurantTable,
  Role,
  SystemSetting,
  StaffSession,
  User,
]
