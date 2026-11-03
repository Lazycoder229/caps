"use client"

import { useEffect, useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { BrainCircuit, LoaderCircle, Play, RotateCcw } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ChatbotModelTraining } from "@/components/admin/chatbot-model-training"
import {
  FORECAST_MIN_HISTORY_DAYS,
  SYNTHETIC_SALES_RECORDS,
  SYNTHETIC_TRAINING_EXAMPLES,
  loadSavedSalesTraining,
  prepareSalesTrainingHistory,
  trainSalesForecast,
  type EpochMetric,
  type SalesHistoryPoint,
  type SalesTrainingResult,
} from "@/lib/sales/tfjs-forecast"

const lossConfig = {
  loss: { label: "Training loss", color: "#f59e0b" },
  validationLoss: { label: "Validation loss", color: "#2563eb" },
} satisfies ChartConfig

const predictionConfig = {
  actual: { label: "Actual / sample sales", color: "#f59e0b" },
  predicted: { label: "Model prediction", color: "#2563eb" },
  baseline: { label: "Same-week baseline", color: "#64748b" },
} satisfies ChartConfig

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value)

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))

export function TrainingWorkspace({
  history,
}: {
  history: SalesHistoryPoint[]
}) {
  const [epochs, setEpochs] = useState(20)
  const [epochMetrics, setEpochMetrics] = useState<EpochMetric[]>([])
  const [result, setResult] = useState<SalesTrainingResult | null>(null)
  const [phase, setPhase] = useState("Ready to train")
  const [error, setError] = useState<string | null>(null)
  const [training, setTraining] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const hasActualSales = history.some((day) => day.sales > 0)
  const trainingHistory = useMemo(
    () => prepareSalesTrainingHistory(history),
    [history]
  )
  const enoughHistory = trainingHistory.length >= FORECAST_MIN_HISTORY_DAYS
  const meanHistory =
    trainingHistory.length > 0
      ? trainingHistory.reduce((sum, day) => sum + day.sales, 0) /
        trainingHistory.length
      : 0
  const phaseEpoch = phase.match(/epoch (\d+) of (\d+)/i)
  const progress = phaseEpoch
    ? (Number(phaseEpoch[1]) / Number(phaseEpoch[2])) * 100
    : 0

  useEffect(() => {
    let active = true
    loadSavedSalesTraining(trainingHistory).then((saved) => {
      if (!active) return
      if (saved) {
        setResult(saved)
        setEpochMetrics(saved.epochs)
        setPhase("Loaded the latest matching training run from the workspace")
      }
      setRestoring(false)
    })
    return () => {
      active = false
    }
  }, [trainingHistory])

  async function startTraining() {
    setTraining(true)
    setError(null)
    setResult(null)
    setEpochMetrics([])
    setPhase("Loading TensorFlow.js…")
    try {
      const trained = await trainSalesForecast(
        trainingHistory,
        epochs,
        (metric) => {
          setEpochMetrics((current) => [...current, metric])
          setPhase(`Training final model · epoch ${metric.epoch} of ${epochs}`)
        },
        setPhase
      )
      setResult(trained)
      setPhase("Training complete")
    } catch (cause) {
      console.error("Sales model training failed:", cause)
      setError(
        cause instanceof Error
          ? cause.message
          : "Training failed. Please try again."
      )
      setPhase("Training failed")
    } finally {
      setTraining(false)
    }
  }

  const backtestChart = result?.backtest.map((point) => ({
    ...point,
    label: dateLabel(point.date),
  }))

  return (
    <main className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Model Training
          </h1>
          <p className="text-sm text-muted-foreground">
            Train and evaluate the 7-day sales forecast using recent completed
            orders.
          </p>
        </div>
        <Button
          onClick={startTraining}
          disabled={training || restoring || !enoughHistory}
        >
          {training ? <LoaderCircle className="animate-spin" /> : <Play />}
          {training
            ? "Training…"
            : restoring
              ? "Loading…"
              : result
                ? "Train again"
                : "Train model"}
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          title="Training history"
          value={`${trainingHistory.length} days`}
          note={
            hasActualSales
              ? "Daily completed sales"
              : "Synthetic preview series"
          }
        />
        <Metric
          title="Mean daily sales"
          value={currency(meanHistory)}
          note={
            hasActualSales
              ? "Average across available history"
              : "Sample average baseline"
          }
        />
        <Metric
          title="Model input"
          value="28 days"
          note="Recent daily revenue sequence"
        />
        <Metric
          title="Forecast horizon"
          value="7 days"
          note="Predicted in each training run"
        />
        <Metric
          title="Synthetic sequences"
          value={SYNTHETIC_TRAINING_EXAMPLES.toLocaleString()}
          note={`${SYNTHETIC_SALES_RECORDS.toLocaleString()} generated daily records (1 year)`}
        />
      </section>

      <ChatbotModelTraining />

      <Card>
        <CardHeader>
          <CardTitle>Training configuration</CardTitle>
          <CardDescription>
            The model uses the last 28 days to predict the next 7 days. A
            held-out week is used for backtesting before the final model is
            trained on all available data plus synthetic sales sequences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Epochs
              <Input
                type="number"
                min={10}
                max={200}
                step={5}
                value={epochs}
                disabled={training}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value))
                    setEpochs(Math.min(200, Math.max(10, value)))
                }}
                className="w-28"
              />
            </label>
            <span className="pb-2 text-xs text-muted-foreground">
              Allowed range: 10–200 · more epochs can increase training time and
              overfitting.
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{phase}</span>
              {training && (
                <span className="text-muted-foreground tabular-nums">
                  {phaseEpoch
                    ? `${phaseEpoch[1]}/${phaseEpoch[2]}`
                    : "Preparing"}
                </span>
              )}
            </div>
            <Progress value={progress} />
          </div>
          {!enoughHistory ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              A full year of daily history is needed before training.
            </p>
          ) : null}
          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            {hasActualSales
              ? "Synthetic training data augments model fitting but is not shown as actual sales. Backtest accuracy is measured against the held-out real sales week."
              : "No completed sales are available. The one-year daily training series and backtest use the synthetic dataset scaled to a ₱5,000 average day. These metrics are a demo only and do not measure this restaurant’s forecast accuracy."}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {epochMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Epoch loss</CardTitle>
            <CardDescription>
              Training and validation mean squared error by epoch; lower is
              better.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lossConfig} className="h-[280px] w-full">
              <LineChart
                data={epochMetrics}
                margin={{ left: 8, right: 12, top: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="epoch" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={68} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="loss"
                  type="monotone"
                  stroke="var(--color-loss)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="validationLoss"
                  type="monotone"
                  stroke="var(--color-validationLoss)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              title={
                hasActualSales
                  ? "Mean actual · test week"
                  : "Mean sample · test week"
              }
              value={currency(result.metrics.meanActual ?? 0)}
              note={
                hasActualSales
                  ? "Average actual sales per day"
                  : "Synthetic sample average per day"
              }
            />
            <Metric
              title="Mean predicted · test week"
              value={currency(result.metrics.meanPredicted ?? 0)}
              note="Average predicted sales per day"
            />
            <Metric
              title="MAE"
              value={currency(result.metrics.mae ?? 0)}
              note="Mean absolute error per day"
            />
            <Metric
              title="RMSE"
              value={currency(result.metrics.rmse ?? 0)}
              note={`WAPE ${formatPercent(result.metrics.wape)} · baseline ${formatPercent(result.metrics.baselineWape)}`}
            />
          </section>

          <p className="text-xs text-muted-foreground">
            {hasActualSales
              ? `Final fit: ${result.actualTrainingExamples.toLocaleString()} real sales windows + ${result.syntheticTrainingExamples.toLocaleString()} synthetic windows.`
              : `Final fit: ${result.syntheticTrainingExamples.toLocaleString()} synthetic windows. No real sales windows are available yet.`}
          </p>

          <Card>
            <CardHeader>
              <CardTitle>
                {hasActualSales
                  ? "Backtest: actual vs predicted"
                  : "Sample backtest"}
              </CardTitle>
              <CardDescription>
                {hasActualSales
                  ? "The model’s 7-day prediction is compared with the held-out actual week and the same-week baseline."
                  : "Synthetic sample values are compared with predictions. This does not measure real restaurant forecast accuracy."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={predictionConfig} className="h-75 w-full">
                <LineChart
                  data={backtestChart}
                  margin={{ left: 8, right: 12, top: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
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
                  <Line
                    dataKey="actual"
                    type="monotone"
                    stroke="var(--color-actual)"
                    strokeWidth={2.5}
                  />
                  <Line
                    dataKey="predicted"
                    type="monotone"
                    stroke="var(--color-predicted)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                  />
                  <Line
                    dataKey="baseline"
                    type="monotone"
                    stroke="var(--color-baseline)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {result.savedToWorkspace
                  ? "Trained model saved to the shared workspace and ready for Sales Forecast on this app."
                  : "Training succeeded, but the model could not be saved to the workspace."}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <RotateCcw className="size-3.5" />
                {new Date(result.trainedAt).toLocaleString("en-PH")}
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}

function Metric({
  title,
  value,
  note,
}: {
  title: string
  value: string
  note: string
}) {
  return (
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`
}
