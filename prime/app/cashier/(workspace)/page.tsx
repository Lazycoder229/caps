import { getAdminDashboardData } from "@/lib/admin/dashboard-data"
import { DashboardWorkspace } from "@/app/admin/dashboard-workspace"

export const dynamic = "force-dynamic"

export default async function CashierDashboardPage() {
  const data = await getAdminDashboardData()
  return <DashboardWorkspace initialData={data} />
}
