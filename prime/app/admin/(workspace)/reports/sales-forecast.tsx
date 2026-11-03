"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"
import { BrainCircuit, LoaderCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SalesReportData } from "@/lib/sales/report-data"
import {
  FORECAST_MIN_HISTORY_DAYS,
  loadSavedSalesForecast,
  prepareSalesTrainingHistory,
  type ForecastMetrics,
} from "@/lib/sales/tfjs-forecast"

type ForecastView = {
  points: Array<{ date: string; label: string; sales: number }>
  metrics: ForecastMetrics
  savedToWorkspace: boolean
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function SalesForecast({
  history,
  basePath = "/admin",
}: {
  history: SalesReportData["forecastHistory"]
  basePath?: "/admin" | "/cashier"
}) {
  const [forecast, setForecast] = useState<ForecastView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modelMissing, setModelMissing] = useState(false)
  const hasActualSales = history.some((day) => day.sales > 0)
  const trainingHistory = useMemo(
    () => prepareSalesTrainingHistory(history),
    [history]
  )
  const enoughHistory = trainingHistory.length >= FORECAST_MIN_HISTORY_DAYS
  const chartConfig = {
    actual: {
      label: hasActualSales ? "Actual sales" : "Synthetic preview",
      color: "#f59e0b",
    },
    forecast: { label: "Forecast sales", color: "#2563eb" },
  } satisfies ChartConfig

  const loadForecast = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const saved = await loadSavedSalesForecast(trainingHistory)
      if (!saved) {
        setForecast(null)
        setModelMissing(true)
        return
      }
      setModelMissing(false)
      setForecast({
        points: saved.forecast.map((sales, index) => {
          const date = addDays(trainingHistory.at(-1)!.date, index + 1)
          return { date, label: formatDate(date), sales }
        }),
        metrics: saved.metrics,
        savedToWorkspace: true,
      })
    } catch (cause) {
      console.error("Unable to generate TensorFlow.js sales forecast:", cause)
      setModelMissing(false)
      setError(
        cause instanceof Error
          ? cause.message
          : "Forecast loading failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [trainingHistory])

  useEffect(() => {
    if (trainingHistory.length >= FORECAST_MIN_HISTORY_DAYS) {
      void loadForecast()
    }
  }, [loadForecast, trainingHistory.length])

  const chartData = [
    ...trainingHistory.slice(-28).map((day) => ({
      date: day.date,
      label: formatDate(day.date),
      actual: day.sales,
      forecast: undefined as number | undefined,
    })),
    ...(forecast?.points.map((point) => ({
      ...point,
      actual: undefined as number | undefined,
      forecast: point.sales,
    })) ?? []),
  ]

  return (
    <Card
      role="tabpanel"
      id="sales-report-panel-forecast"
      aria-labelledby="sales-report-tab-forecast"
      tabIndex={0}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-600" />
            Future sales forecast
          </CardTitle>
          <CardDescription>
            Displays the latest forecast from the model trained on one year of
            daily sales.
          </CardDescription>
        </div>
        <Button onClick={loadForecast} disabled={loading || !enoughHistory}>
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <BrainCircuit />
          )}
          {loading
            ? "Loading forecast…"
            : modelMissing
              ? "Check saved model"
              : forecast
                ? "Refresh forecast"
                : "Load forecast"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enoughHistory ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            A full year of daily sales history is needed before the model can
            make a useful forecast.
          </div>
        ) : !hasActualSales ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No completed sales have been recorded yet. This preview uses the
            synthetic training dataset, scaled to a ₱5,000 average day; it does
            not represent your restaurant’s actual sales. It will use real sales
            automatically once they are available.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Uses daily revenue as the input signal. Cancelled and voided orders
            are excluded. The forecast is a planning estimate, not a guaranteed
            result.
          </p>
        )}

        {modelMissing && enoughHistory && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {basePath === "/admin" ? (
              <>
                No compatible one-year model is saved yet. Train it once in{" "}
                <Link
                  href="/admin/training"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Model Training
                </Link>{" "}
                to build it from the one-year daily history. This page will
                display that saved result without training again.
              </>
            ) : (
              "No compatible forecast model is saved yet. Ask an administrator to prepare the model before viewing the forecast."
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {forecast && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Next 7 days (forecast)"
                value={currency(
                  forecast.points.reduce((sum, day) => sum + day.sales, 0)
                )}
              />
              <Metric
                label="Model backtest WAPE"
                value={percent(forecast.metrics.wape)}
              />
              <Metric
                label="Same-week baseline WAPE"
                value={percent(forecast.metrics.baselineWape)}
              />
            </div>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ComposedChart
                data={chartData}
                margin={{ left: 8, right: 12, top: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={(value: number) =>
                    new Intl.NumberFormat("en-PH", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => currency(Number(value))}
                    />
                  }
                />
                <Area
                  dataKey="actual"
                  type="monotone"
                  fill="var(--color-actual)"
                  fillOpacity={0.14}
                  stroke="var(--color-actual)"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  dataKey="forecast"
                  type="monotone"
                  stroke="var(--color-forecast)"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                  connectNulls
                />
              </ComposedChart>
            </ChartContainer>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Forecast sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.points.map((day) => (
                    <tr key={day.date} className="border-t">
                      <td className="px-3 py-2">{day.label}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {currency(day.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {!hasActualSales
                ? "Sample preview only. The same-week baseline repeats the previous week’s synthetic sample."
                : forecast.savedToWorkspace
                  ? "Using the model saved in the shared workspace. The same-week baseline repeats the previous week’s actual sales."
                  : "The same-week baseline repeats the previous week’s actual sales."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function percent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  )
}
