import { getInitializedDataSource } from "@/lib/database/data-source"
import { IsNull } from "typeorm"
import { Order } from "@/lib/database/entities/entities/Order"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { dateOnlyInManila } from "@/lib/dates/date-only"
import type { ReceiptTemplateSettings } from "@/components/receipt/receipt-template"
import { LiveOrdersBoard } from "./orders-board"
import type { CustomerOption, LiveOrder } from "./types"

export async function LiveOrdersPageContent({
  basePath = "/admin",
}: {
  basePath?: "/admin" | "/cashier"
} = {}) {
  try {
    const source = await getInitializedDataSource()
    const [
      orders,
      menuItems,
      tables,
      discountTypes,
      promotions,
      settings,
      customers,
    ] = await Promise.all([
      source.getRepository(Order).find({
        relations: {
          table: true,
          customer: true,
          items: { menuItem: true },
          statusHistory: true,
          payments: true,
        },
        where: { adminHiddenAt: IsNull() },
        order: { createdAt: "DESC" },
        take: 200,
      }),
      source.getRepository(MenuItem).find({
        where: { isAvailable: true },
        relations: { category: true },
        order: { name: "ASC" },
      }),
      source
        .getRepository(RestaurantTable)
        .find({ order: { tableNumber: "ASC" } }),
      source
        .getRepository(DiscountType)
        .find({ where: { isActive: true }, order: { name: "ASC" } }),
      source.getRepository(Promotion).find({
        where: { isActive: true },
        relations: { items: true },
        order: { name: "ASC" },
      }),
      source
        .getRepository(SystemSetting)
        .createQueryBuilder("settings")
        .addSelect("settings.gcashQrImage")
        .addSelect("settings.mayaQrImage")
        .addSelect("settings.qrphQrImage")
        .take(1)
        .getOne(),
      source
        .getRepository(Customer)
        .find({ order: { name: "ASC" }, take: 1000 }),
    ])
    const rows: LiveOrder[] = orders.map((order) => {
      const payment = [...(order.payments ?? [])].sort(
        (a, b) => b.paidAt.getTime() - a.paidAt.getTime()
      )[0]
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentReference: order.paymentReference,
        customerPaymentReference: order.customerPaymentReference,
        receiptNumber: payment?.receiptNumber ?? null,
        paidAt: payment?.paidAt.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        customerName: order.customer?.name ?? null,
        customerContact: order.customer?.contactNumber ?? null,
        tableNumber: order.table?.tableNumber ?? null,
        items: order.items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.menuItem?.name ?? "Removed menu item",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          notes: item.notes,
        })),
        statusHistory: order.statusHistory
          .slice()
          .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())
          .map((history) => ({
            status: history.status,
            changedAt: history.changedAt.toISOString(),
          })),
      }
    })

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
    const discountsEnabled = settings?.seniorPwdDiscountEnabled ?? true
    return (
      <LiveOrdersBoard
        orders={rows}
        customers={customers.map((customer): CustomerOption => ({
          id: customer.id,
          name: customer.name,
          contactNumber: customer.contactNumber,
          pointsBalance: customer.loyaltyPointsBalance,
        }))}
        discountsEnabled={discountsEnabled}
        paymentMethods={[
          ...(settings?.paymentCashEnabled !== false
            ? [{ id: "cash", label: "Cash" }]
            : []),
          ...(settings?.paymentGcashEnabled !== false
            ? [{ id: "gcash", label: "GCash" }]
            : []),
          ...(settings?.paymentMayaEnabled !== false
            ? [{ id: "maya", label: "Maya" }]
            : []),
          ...(settings?.paymentQrphEnabled !== false
            ? [{ id: "qrph", label: "QRPH" }]
            : []),
        ]}
        paymentQrImages={{
          gcash: settings?.gcashQrImage ?? null,
          maya: settings?.mayaQrImage ?? null,
          qrph: settings?.qrphQrImage ?? null,
        }}
        menuOptions={menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category?.name ?? "Menu",
          price: Number(item.price),
          imageUrl: item.imageUrl,
        }))}
        tables={tables
          .filter((table) => table.status === "available")
          .map((table) => ({
            id: table.id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
          }))}
        discountOptions={
          discountsEnabled
            ? discountTypes.map((item) => ({
                id: item.id,
                name: item.name,
                percentage: Number(item.percentage),
                requiresIdVerification: item.requiresIdVerification,
              }))
            : []
        }
        promotionOptions={promotions.map((item) => {
          const startsOn = dateOnlyInManila(item.startDate)
          const endsOn = dateOnlyInManila(item.endDate)
          const unavailableReason = !item.isActive
            ? "Inactive"
            : item.promoType === "buy_x_get_y"
              ? "Not supported at checkout"
              : startsOn > today
                ? "Scheduled"
                : endsOn < today
                  ? "Expired"
                  : item.usageLimit !== null &&
                      item.usageCount >= item.usageLimit
                    ? "Limit reached"
                    : null
          return {
            id: item.id,
            name: item.name,
            promoType: item.promoType,
            discountValue: Number(item.discountValue ?? 0),
            minSpend: item.minSpend === null ? null : Number(item.minSpend),
            menuItemIds: item.items.map((menu) => menu.id),
            isAvailable: unavailableReason === null,
            unavailableReason,
          }
        })}
        pricing={{
          vatEnabled: settings?.vatEnabled ?? false,
          vatRate: Number(settings?.vatRate ?? 0),
          vatInclusive: settings?.vatInclusive ?? false,
          serviceChargeEnabled: settings?.serviceChargeEnabled ?? false,
          serviceChargeRate: Number(settings?.serviceChargeRate ?? 0),
        }}
        receiptSettings={
          settings
            ? {
                restaurantName: settings.restaurantName,
                branchName: settings.branchName,
                contactNumber: settings.contactNumber,
                email: settings.email,
                address: settings.address,
                tinNumber: settings.tinNumber,
                birMin: settings.birMin,
                currencySymbol: settings.currencySymbol,
                currencyCode: settings.currencyCode,
                vatEnabled: settings.vatEnabled,
                vatRate: Number(settings.vatRate),
                vatInclusive: settings.vatInclusive,
                serviceChargeEnabled: settings.serviceChargeEnabled,
                serviceChargeRate: Number(settings.serviceChargeRate),
                receiptHeader: settings.receiptHeader,
                receiptFooter: settings.receiptFooter,
                wifiSsid: settings.wifiSsid,
                wifiPassword: settings.showWifiOnReceipt
                  ? (settings.wifiPassword ?? undefined)
                  : undefined,
                showWifiOnReceipt: settings.showWifiOnReceipt,
              }
            : defaultReceiptSettings
        }
        basePath={basePath}
      />
    )
  } catch (error) {
    console.error("Unable to load live orders:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Orders</h1>
          <p className="text-sm text-muted-foreground">
            Review new orders, update their progress, and track stock
            consumption.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect live orders."
            : "Orders could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}

const defaultReceiptSettings: ReceiptTemplateSettings = {
  restaurantName: "PRIME Roast & Grill",
  branchName: "",
  contactNumber: "",
  email: "",
  address: "",
  tinNumber: null,
  birMin: null,
  currencySymbol: "₱",
  currencyCode: "PHP",
  vatEnabled: false,
  vatRate: 0,
  vatInclusive: false,
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  receiptHeader: null,
  receiptFooter: null,
  wifiSsid: null,
  showWifiOnReceipt: false,
}
