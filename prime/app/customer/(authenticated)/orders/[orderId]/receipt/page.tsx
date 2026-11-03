import { notFound } from "next/navigation"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { Order } from "@/lib/database/entities/entities/Order"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { ReceiptTemplate } from "@/components/receipt/receipt-template"

export default async function CustomerReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const customer = await requireCustomerSession()
  const { orderId } = await params
  const source = await getInitializedDataSource()
  const order = await source.getRepository(Order).findOne({
    where: { id: orderId, customerId: customer.id, paymentStatus: "paid" },
    relations: { items: { menuItem: true }, payments: true },
  })
  if (!order) notFound()
  const settings = await source
    .getRepository(SystemSetting)
    .findOne({ where: {} })
  if (!settings) notFound()
  const payment = [...(order.payments ?? [])].sort(
    (a, b) => b.paidAt.getTime() - a.paidAt.getTime()
  )[0]
  const taxableSubtotal = Math.max(
    0,
    Number(order.subtotal) - Number(order.discount)
  )
  const serviceCharge = Math.max(
    0,
    Number(order.total) -
      taxableSubtotal -
      (settings.vatEnabled && !settings.vatInclusive ? Number(order.tax) : 0)
  )
  return (
    <main className="grid justify-items-center gap-4">
      <header className="w-full max-w-[340px]">
        <p className="text-sm text-muted-foreground">Digital receipt</p>
        <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
      </header>
      <ReceiptTemplate
        settings={{
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
          vatRate: settings.vatRate,
          vatInclusive: settings.vatInclusive,
          serviceChargeEnabled: settings.serviceChargeEnabled,
          serviceChargeRate: settings.serviceChargeRate,
          receiptHeader: settings.receiptHeader,
          receiptFooter: settings.receiptFooter,
          wifiSsid: settings.wifiSsid,
          wifiPassword: settings.wifiPassword ?? undefined,
          showWifiOnReceipt: settings.showWifiOnReceipt,
        }}
        receipt={{
          receiptNumber: payment?.receiptNumber ?? order.orderNumber,
          date: payment?.paidAt ?? order.createdAt,
          items: order.items.map((item) => ({
            name: item.menuItem?.name ?? "Menu item",
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
          paymentMethod:
            payment?.paymentMethod ?? order.paymentMethod ?? "Paid",
          cashier: "PRIME",
          totals: {
            subtotal: Number(order.subtotal),
            discount: Number(order.discount),
            tax: Number(order.tax),
            serviceCharge,
            total: Number(order.total),
          },
        }}
      />
    </main>
  )
}
