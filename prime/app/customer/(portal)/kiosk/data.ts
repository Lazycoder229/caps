import { getInitializedDataSource } from "@/lib/database/data-source"
import { Category } from "@/lib/database/entities/entities/Category"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { dateOnlyInManila } from "@/lib/dates/date-only"
import type { KioskMenuItem, KioskDiscount, KioskPaymentMethod, KioskPromotion, KioskTable } from "./types"
import type { ReceiptTemplateSettings } from "@/components/receipt/receipt-template"

export type KioskCatalog = {
  menu: KioskMenuItem[]
  categories: string[]
  tables: KioskTable[]
  promotions: KioskPromotion[]
  discounts: KioskDiscount[]
  paymentMethods: KioskPaymentMethod[]
  pricing: { vatEnabled: boolean; vatRate: number; vatInclusive: boolean; serviceChargeEnabled: boolean; serviceChargeRate: number; requireTableSelection: boolean }
  delivery: { enabled: boolean; fee: number; minimumOrder: number; serviceAddress: string }
  currencyCode: string
  currencySymbol: string
  receiptSettings: ReceiptTemplateSettings
}

export async function getKioskCatalog(initialTableId: string | null): Promise<KioskCatalog> {
  const source = await getInitializedDataSource()
  const [menus, categories, availableTables, scannedTable, promotions, discounts, settings] = await Promise.all([
    source.getRepository(MenuItem).find({ where: { isAvailable: true }, relations: { category: true }, order: { name: "ASC" } }),
    source.getRepository(Category).find({ where: { isActive: true }, order: { sortOrder: "ASC" } }),
    source.getRepository(RestaurantTable).find({ where: { status: "available" }, order: { tableNumber: "ASC" } }),
    initialTableId ? source.getRepository(RestaurantTable).findOneBy({ id: initialTableId }) : Promise.resolve(null),
    source.getRepository(Promotion).find({ relations: { items: true }, order: { name: "ASC" } }),
    source.getRepository(DiscountType).find({ where: { isActive: true }, order: { name: "ASC" } }),
    source.getRepository(SystemSetting).createQueryBuilder("settings").addSelect("settings.gcashQrImage").addSelect("settings.mayaQrImage").addSelect("settings.qrphQrImage").take(1).getOne(),
  ])
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  const activePromotions: KioskPromotion[] = promotions.filter((item) => item.isActive && item.promoType !== "buy_x_get_y" && dateOnlyInManila(item.startDate) <= today && dateOnlyInManila(item.endDate) >= today && (item.usageLimit === null || item.usageCount < item.usageLimit)).map((item) => ({ id: item.id, name: item.name, promoType: item.promoType as "percentage" | "fixed_amount", discountValue: Number(item.discountValue ?? 0), minSpend: item.minSpend === null ? null : Number(item.minSpend), menuItemIds: item.items.map((menu) => menu.id) }))
  const activeDiscounts: KioskDiscount[] = settings?.seniorPwdDiscountEnabled === false ? [] : discounts.map((item) => ({ id: item.id, name: item.name, percentage: Number(item.percentage), requiresIdVerification: item.requiresIdVerification }))
  const paymentMethods: KioskPaymentMethod[] = [
    ...(settings?.paymentCashEnabled !== false ? [{ id: "cash" as const, label: "Cash at counter", qrImage: null }] : []),
    ...(settings?.paymentGcashEnabled !== false && settings?.gcashQrImage ? [{ id: "gcash" as const, label: "GCash", qrImage: settings.gcashQrImage }] : []),
    ...(settings?.paymentMayaEnabled !== false && settings?.mayaQrImage ? [{ id: "maya" as const, label: "Maya", qrImage: settings.mayaQrImage }] : []),
    ...(settings?.paymentQrphEnabled !== false && settings?.qrphQrImage ? [{ id: "qrph" as const, label: "QRPH", qrImage: settings.qrphQrImage }] : []),
  ]
  const tableRows = [...availableTables, ...(scannedTable && !availableTables.some((table) => table.id === scannedTable.id) ? [scannedTable] : [])].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }))
  return {
    menu: menus.map((item) => ({ id: item.id, name: item.name, description: item.description, category: item.category?.name ?? "Menu", price: Number(item.price), imageUrl: item.imageUrl })),
    categories: [...new Set(["All", ...categories.map((item) => item.name)])],
    tables: tableRows.map((table) => ({ id: table.id, tableNumber: table.tableNumber, capacity: table.capacity, status: table.status })),
    promotions: activePromotions,
    discounts: activeDiscounts,
    paymentMethods,
    pricing: { vatEnabled: settings?.vatEnabled ?? false, vatRate: Number(settings?.vatRate ?? 0), vatInclusive: settings?.vatInclusive ?? false, serviceChargeEnabled: settings?.serviceChargeEnabled ?? false, serviceChargeRate: Number(settings?.serviceChargeRate ?? 0), requireTableSelection: settings?.requireTableSelection ?? false },
    delivery: { enabled: settings?.deliveryEnabled ?? false, fee: Number(settings?.deliveryFee ?? 49), minimumOrder: Number(settings?.deliveryMinimumOrder ?? 0), serviceAddress: settings?.address ?? "" },
    currencyCode: settings?.currencyCode ?? "PHP",
    currencySymbol: settings?.currencySymbol ?? "₱",
    receiptSettings: {
      restaurantName: settings?.restaurantName ?? "PRIME Roast & Grill", branchName: settings?.branchName ?? "", contactNumber: settings?.contactNumber ?? "", email: settings?.email ?? "", address: settings?.address ?? "", tinNumber: settings?.tinNumber ?? null, birMin: settings?.birMin ?? null,
      currencySymbol: settings?.currencySymbol ?? "₱", currencyCode: settings?.currencyCode ?? "PHP", vatEnabled: settings?.vatEnabled ?? false, vatRate: Number(settings?.vatRate ?? 0), vatInclusive: settings?.vatInclusive ?? false, serviceChargeEnabled: settings?.serviceChargeEnabled ?? false, serviceChargeRate: Number(settings?.serviceChargeRate ?? 0), receiptHeader: settings?.receiptHeader ?? null, receiptFooter: settings?.receiptFooter ?? null,
      wifiSsid: settings?.wifiSsid ?? null, wifiPassword: undefined, showWifiOnReceipt: settings?.showWifiOnReceipt ?? false,
    },
  }
}
