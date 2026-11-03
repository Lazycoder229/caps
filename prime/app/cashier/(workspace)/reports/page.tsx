import { getSalesReportData } from "@/lib/sales/report-data"
import { SalesReportsWorkspace } from "@/app/admin/(workspace)/reports/workspace"

export default async function CashierReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  try {
    const data = await getSalesReportData(params, { includeForecast: true })
    return <SalesReportsWorkspace data={data} basePath="/cashier" />
  } catch (error) {
    console.error("Unable to load cashier reports:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Reports &amp; Analytics</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Reports could not load. Check the database connection and migrations.
        </p>
      </main>
    )
  }
}
