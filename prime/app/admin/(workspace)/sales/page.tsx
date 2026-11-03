import { getSalesReportData } from "@/lib/sales/report-data"
import { SalesReportsWorkspace } from "../reports/workspace"

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  try {
    const data = await getSalesReportData(params, { includeForecast: true })
    return (
      <SalesReportsWorkspace
        data={data}
        title="Sales & Reports"
        description="Review completed sales, payments, and order activity for a selected period."
      />
    )
  } catch (error) {
    console.error("Unable to load sales:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Sales could not load. Check the database connection and migrations.
        </p>
      </main>
    )
  }
}
