import { getCustomerSession } from "@/lib/customer-auth/session"
import { KioskDataLoader } from "./data-loader"

export default async function CustomerKioskPage({ searchParams }: { searchParams?: Promise<{ tableId?: string | string[] }> }) {
  const [customer, params] = await Promise.all([
    getCustomerSession(),
    searchParams ?? Promise.resolve({ tableId: undefined as string | string[] | undefined }),
  ])
  const rawTableId = Array.isArray(params.tableId) ? params.tableId[0] : params.tableId
  const initialTableId = rawTableId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawTableId) ? rawTableId : null
  return <KioskDataLoader isAuthenticated={Boolean(customer)} initialTableId={initialTableId} />
}
