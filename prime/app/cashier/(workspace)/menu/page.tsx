import { InventoryPageContent } from "@/app/admin/(workspace)/inventory/inventory-page-content"

export default async function CashierMenuPage() {
  return await InventoryPageContent({ tab: "menu", menuOnly: true })
}
