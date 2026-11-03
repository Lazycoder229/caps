import { getSalesForecastHistory } from "@/lib/sales/report-data"
import { TrainingWorkspace } from "./workspace"

export default async function TrainingPage() {
  try {
    const history = await getSalesForecastHistory()
    return <TrainingWorkspace history={history} />
  } catch (error) {
    console.error("Unable to load training data:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Model Training</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Sales history could not load. Check the database connection and
          migrations.
        </p>
      </main>
    )
  }
}
