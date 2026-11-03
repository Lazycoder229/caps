import { InventoryPageContent } from "./inventory-page-content"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const { tab = "overview" } = searchParams ? await searchParams : {}
  return await InventoryPageContent({ tab })
}
