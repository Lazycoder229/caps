import { LiveOrdersPageContent } from "@/app/admin/(workspace)/orders/live-orders-content"

export default async function CashierOrdersPage() {
  return await LiveOrdersPageContent({ basePath: "/cashier" })
}
