"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Bot, LoaderCircle, Play } from "lucide-react"
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
import chatbotDataset from "@/lib/chatbot/prime-pos-chatbot-dataset.json"
import {
  CHATBOT_TRAINING_COUNTS,
  CHATBOT_DATASET_VERSION,
  loadSavedChatbotModel,
  trainChatbotIntentModel,
  type ChatbotEpochMetric,
  type ChatbotTrainingMetadata,
} from "@/lib/chatbot/tfjs-intent-model"

const chartConfig = {
  loss: { label: "Training loss", color: "#f59e0b" },
  validationLoss: { label: "Validation loss", color: "#2563eb" },
} satisfies ChartConfig

export function ChatbotModelTraining() {
  const [epochs, setEpochs] = useState(35)
  const [metrics, setMetrics] = useState<ChatbotEpochMetric[]>([])
  const [metadata, setMetadata] = useState<ChatbotTrainingMetadata | null>(null)
  const [training, setTraining] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadSavedChatbotModel()
      .then((saved) => {
        if (active) setMetadata(saved)
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the saved chatbot model."
          )
      })
      .finally(() => {
        if (active) setRestoring(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function startTraining() {
    setTraining(true)
    setError(null)
    setMetrics([])
    try {
      const result = await trainChatbotIntentModel(epochs, (metric) => {
        setMetrics((current) => [...current, metric])
      })
      setMetadata(result.metadata)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Chatbot model training failed."
      )
    } finally {
      setTraining(false)
    }
  }

  const progress = metrics.length ? (metrics.length / epochs) * 100 : 0
  const currentAccuracy = metrics.at(-1)?.validationAccuracy

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              PRIME chatbot model
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              Train a TensorFlow.js intent classifier from the role-based help
              questions and the menu snapshot taken from db.sql. The model is
              saved to the workspace and used by PRIME in admin, cashier, and
              customer pages.
            </CardDescription>
          </div>
          <Button
            onClick={startTraining}
            disabled={training || restoring}
            size="sm"
          >
            {training ? <LoaderCircle className="animate-spin" /> : <Play />}
            {training
              ? "Training " + metrics.length + "/" + epochs
              : metadata
                ? "Train again"
                : restoring
                  ? "Loading model…"
                  : "Train chatbot"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <DatasetMetric
            label="Training questions"
            value={CHATBOT_TRAINING_COUNTS.sampleCount}
          />
          <DatasetMetric
            label="Intent classes"
            value={CHATBOT_TRAINING_COUNTS.intentCount}
          />
          <DatasetMetric
            label="Menu items from db.sql"
            value={CHATBOT_TRAINING_COUNTS.menuItemCount}
          />
          <DatasetMetric
            label="Recipe mappings in db.sql"
            value={chatbotDataset.databaseSnapshot.recipeRows}
          />
        </div>

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
          {training && (
            <span className="pb-2 text-xs text-muted-foreground">
              Validation accuracy{" "}
              {currentAccuracy === undefined
                ? "…"
                : (currentAccuracy * 100).toFixed(1) + "%"}
            </span>
          )}
        </div>

        {training && <Progress value={progress} />}

        {metrics.length > 0 && (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <LineChart data={metrics} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="epoch" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={46} />
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
              />
            </LineChart>
          </ChartContainer>
        )}

        {metadata && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">
              {metadata.datasetVersion === CHATBOT_DATASET_VERSION
                ? "Saved model is ready for PRIME"
                : "Dataset changed · retrain the model"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metadata.sampleCount} questions · {metadata.intentCount} intents
              · {metadata.epochs} epochs · validation accuracy{" "}
              {(metadata.validationAccuracy * 100).toFixed(1)}% · saved{" "}
              {new Date(metadata.trainedAt).toLocaleString("en-PH")}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DatasetMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
