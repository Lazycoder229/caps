import { DashboardWorkspace } from "../dashboard-workspace"
import { getAdminDashboardData } from "@/lib/admin/dashboard-data"

export const dynamic = "force-dynamic"

export default async function Page() {
  const data = await getAdminDashboardData()
  return <DashboardWorkspace initialData={data} />
}
