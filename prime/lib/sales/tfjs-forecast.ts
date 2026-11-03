import type { Tensor } from "@tensorflow/tfjs"
import syntheticSalesDataset from "./synthetic-sales.json"

export const FORECAST_LOOKBACK_DAYS = 28
export const FORECAST_HORIZON_DAYS = 7
export const FORECAST_MIN_HISTORY_DAYS = 365
export const SALES_TRAINING_DATA_VERSION = 2
export const SYNTHETIC_SALES_RECORDS = syntheticSalesDataset.records.length
export const SYNTHETIC_TRAINING_EXAMPLES =
  SYNTHETIC_SALES_RECORDS - FORECAST_LOOKBACK_DAYS - FORECAST_HORIZON_DAYS + 1
const MODEL_ENDPOINT = "/api/admin/sales-forecast/model"
const LEGACY_MODEL_STORAGE_KEY = "prime-sales-forecast-v1"
const LEGACY_METADATA_KEY = "prime-sales-forecast-metadata-v1"
type TensorFlowModule = typeof import("@tensorflow/tfjs")
type ForecastModel = import("@tensorflow/tfjs").LayersModel

export type SalesHistoryPoint = { date: string; sales: number }
export type EpochMetric = {
  epoch: number
  loss: number
  validationLoss: number | null
}
export type BacktestPoint = {
  date: string
  actual: number
  predicted: number
  baseline: number
}
export type ForecastMetrics = {
  mae: number | null
  rmse: number | null
  wape: number | null
  baselineWape: number | null
  meanActual: number | null
  meanPredicted: number | null
}
export type SalesTrainingResult = {
  forecast: number[]
  backtest: BacktestPoint[]
  metrics: ForecastMetrics
  epochs: EpochMetric[]
  trainedAt: string
  savedToWorkspace: boolean
  actualTrainingExamples: number
  syntheticTrainingExamples: number
  trainingDataVersion: number
}

function historySignature(history: SalesHistoryPoint[]) {
  const input = history.map((day) => `${day.date}:${day.sales}`).join("|")
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${history.length}-${(hash >>> 0).toString(16)}`
}

function makeExamples(values: number[], scale: number) {
  const features: number[][] = []
  const labels: number[][] = []
  for (
    let start = FORECAST_LOOKBACK_DAYS;
    start + FORECAST_HORIZON_DAYS <= values.length;
    start++
  ) {
    features.push(
      values
        .slice(start - FORECAST_LOOKBACK_DAYS, start)
        .map((value) => Math.log1p(value) / scale)
    )
    labels.push(
      values
        .slice(start, start + FORECAST_HORIZON_DAYS)
        .map((value) => Math.log1p(value) / scale)
    )
  }
  return { features, labels }
}

function makeSyntheticValues(referenceValues: number[]) {
  const referenceMean =
    referenceValues.reduce((sum, value) => sum + value, 0) /
    Math.max(1, referenceValues.length)
  const sourceValues = syntheticSalesDataset.records.map((row) => row.sales)
  const sourceMean =
    sourceValues.reduce((sum, value) => sum + value, 0) / sourceValues.length
  const scaleMean = referenceMean > 0 ? referenceMean : sourceMean
  return sourceValues.map((value) => (value / sourceMean) * scaleMean)
}

export function prepareSalesTrainingHistory(history: SalesHistoryPoint[]) {
  if (history.some((day) => day.sales > 0)) return history
  const sourceValues = syntheticSalesDataset.records.map((row) => row.sales)
  const sourceMean =
    sourceValues.reduce((sum, value) => sum + value, 0) / sourceValues.length
  const previewValues = sourceValues.slice(-history.length)
  return history.map((day, index) => ({
    date: day.date,
    sales: (previewValues[index] / sourceMean) * 5000,
  }))
}

function summarize(actual: number[], predicted: number[]) {
  const errors = actual.map((value, index) => value - predicted[index])
  const mae =
    errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length
  const rmse = Math.sqrt(
    errors.reduce((sum, value) => sum + value * value, 0) / errors.length
  )
  const totalActual = actual.reduce((sum, value) => sum + value, 0)
  const absoluteError = errors.reduce((sum, value) => sum + Math.abs(value), 0)
  const meanActual = totalActual / actual.length
  const meanPredicted =
    predicted.reduce((sum, value) => sum + value, 0) / predicted.length
  return {
    mae,
    rmse,
    wape: totalActual > 0 ? (absoluteError / totalActual) * 100 : null,
    meanActual,
    meanPredicted,
  }
}

async function initializeTensorFlow(tf: TensorFlowModule) {
  try {
    const webglAvailable = await tf.setBackend("webgl")
    if (!webglAvailable) await tf.setBackend("cpu")
  } catch {
    await tf.setBackend("cpu")
  }
  await tf.ready()
}

function toBase64(bytes: Uint8Array) {
  let binary = ""
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, Math.min(index + chunkSize, bytes.length))
    )
  }
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

async function fetchWorkspaceModel() {
  const response = await fetch(MODEL_ENDPOINT, { cache: "no-store" })
  if (response.status === 404) return null
  if (response.status === 401 || response.status === 403)
    throw new Error(
      "Your admin session cannot access the saved forecast model."
    )
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(
      result?.message ?? "Could not load the workspace sales model."
    )
  }
  return (await response.json()) as {
    modelArtifacts: Record<string, unknown>
    weightDataBase64: string
    training: SalesTrainingResult & { signature: string; scale: number }
  }
}

async function saveWorkspaceModel(
  tf: TensorFlowModule,
  model: ForecastModel,
  training: SalesTrainingResult & { signature: string; scale: number }
) {
  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      if (!artifacts.weightData) throw new Error("Model weights are missing.")
      const weightParts = Array.isArray(artifacts.weightData)
        ? artifacts.weightData
        : [artifacts.weightData]
      const weightBytes = new Uint8Array(
        weightParts.reduce((size, part) => size + part.byteLength, 0)
      )
      let offset = 0
      for (const part of weightParts) {
        weightBytes.set(new Uint8Array(part), offset)
        offset += part.byteLength
      }
      const modelArtifacts = { ...artifacts }
      delete modelArtifacts.weightData
      const response = await fetch(MODEL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelArtifacts,
          weightDataBase64: toBase64(weightBytes),
          training,
        }),
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(
          result?.message ?? "Could not save the model to workspace."
        )
      }
      return {
        modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
      }
    })
  )
}

async function loadWorkspaceLayersModel(tf: TensorFlowModule) {
  let saved = await fetchWorkspaceModel()
  if (!saved) {
    const legacyMetadata = window.localStorage.getItem(LEGACY_METADATA_KEY)
    if (legacyMetadata) {
      const legacyTraining = JSON.parse(
        legacyMetadata
      ) as SalesTrainingResult & {
        signature: string
        scale: number
      }
      const legacyModel = await tf.loadLayersModel(
        `indexeddb://${LEGACY_MODEL_STORAGE_KEY}`
      )
      try {
        await saveWorkspaceModel(tf, legacyModel, {
          ...legacyTraining,
          savedToWorkspace: true,
        })
      } finally {
        legacyModel.dispose()
      }
      saved = await fetchWorkspaceModel()
    }
  }
  if (!saved) return null
  const ioHandler = {
    load: async () => ({
      ...saved.modelArtifacts,
      weightData: fromBase64(saved.weightDataBase64),
    }),
  }
  const model = await tf.loadLayersModel(
    ioHandler as Parameters<TensorFlowModule["loadLayersModel"]>[0]
  )
  return { model, training: saved.training }
}

async function fitModel(
  tf: TensorFlowModule,
  values: number[],
  scale: number,
  epochs: number,
  onEpoch?: (metric: EpochMetric) => void,
  augmentWithSynthetic = false
) {
  const { features, labels } = makeExamples(values, scale)
  if (augmentWithSynthetic) {
    const synthetic = makeExamples(makeSyntheticValues(values), scale)
    features.push(...synthetic.features)
    labels.push(...synthetic.labels)
  }
  if (!features.length) throw new Error("Not enough history to train a model.")

  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      inputShape: [FORECAST_LOOKBACK_DAYS],
      units: 24,
      activation: "relu",
    })
  )
  model.add(
    tf.layers.dense({ units: FORECAST_HORIZON_DAYS, activation: "relu" })
  )
  model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" })

  const input = tf.tensor2d(features)
  const output = tf.tensor2d(labels)
  try {
    await model.fit(input, output, {
      epochs,
      batchSize: 128,
      shuffle: false,
      validationSplit: 0.2,
      verbose: 0,
      yieldEvery: 5,
      callbacks: onEpoch
        ? {
            onEpochEnd: async (epoch, logs) => {
              onEpoch({
                epoch: epoch + 1,
                loss: Number(logs?.loss ?? 0),
                validationLoss:
                  logs?.val_loss === undefined ? null : Number(logs.val_loss),
              })
            },
          }
        : undefined,
    })
  } finally {
    input.dispose()
    output.dispose()
  }
  return model
}

async function predict(
  tf: TensorFlowModule,
  model: ForecastModel,
  recent: number[],
  scale: number
) {
  const input = tf.tensor2d([recent.map((value) => Math.log1p(value) / scale)])
  const prediction = model.predict(input) as Tensor
  try {
    const normalized = Array.from(await prediction.data())
    return normalized.map((value) => Math.max(0, Math.expm1(value * scale)))
  } finally {
    input.dispose()
    prediction.dispose()
  }
}

export async function trainSalesForecast(
  history: SalesHistoryPoint[],
  epochs: number,
  onEpoch?: (metric: EpochMetric) => void,
  onPhase?: (phase: string) => void
): Promise<SalesTrainingResult> {
  if (history.length < FORECAST_MIN_HISTORY_DAYS) {
    throw new Error("A full year of daily sales history is required.")
  }
  const values = history.map((day) => Math.max(0, day.sales))
  const split = values.length - FORECAST_HORIZON_DAYS
  const evaluationValues = values.slice(0, split)
  const evaluationScale = Math.max(1, Math.log1p(Math.max(...evaluationValues)))
  const fullScale = Math.max(1, Math.log1p(Math.max(...values)))
  const tf = await import("@tensorflow/tfjs")
  await initializeTensorFlow(tf)

  onPhase?.("Backtesting against the latest 7 days…")
  const backtestEpochs = Math.min(epochs, 8)
  const evaluationModel = await fitModel(
    tf,
    evaluationValues,
    evaluationScale,
    backtestEpochs,
    (metric) =>
      onPhase?.(`Backtesting · epoch ${metric.epoch} of ${backtestEpochs}`),
    true
  )
  const actual = values.slice(split)
  const predicted = await predict(
    tf,
    evaluationModel,
    values.slice(split - FORECAST_LOOKBACK_DAYS, split),
    evaluationScale
  )
  evaluationModel.dispose()
  const baseline = values.slice(split - FORECAST_HORIZON_DAYS, split)
  const metrics = summarize(actual, predicted)
  const baselineWape = summarize(actual, baseline).wape
  const backtest = actual.map((value, index) => ({
    date: history[split + index].date,
    actual: value,
    predicted: predicted[index],
    baseline: baseline[index],
  }))

  onPhase?.("Training final model · starting")
  const epochMetrics: EpochMetric[] = []
  const model = await fitModel(
    tf,
    values,
    fullScale,
    epochs,
    (metric) => {
      epochMetrics.push(metric)
      onEpoch?.(metric)
    },
    true
  )
  const forecast = await predict(
    tf,
    model,
    values.slice(-FORECAST_LOOKBACK_DAYS),
    fullScale
  )
  const trainedAt = new Date().toISOString()
  const trainingMetadata = {
    signature: historySignature(history),
    scale: fullScale,
    forecast,
    backtest,
    metrics: { ...metrics, baselineWape },
    epochs: epochMetrics,
    trainedAt,
    savedToWorkspace: false,
    actualTrainingExamples: makeExamples(values, fullScale).features.length,
    syntheticTrainingExamples: SYNTHETIC_TRAINING_EXAMPLES,
    trainingDataVersion: SALES_TRAINING_DATA_VERSION,
  }
  let savedToWorkspace = false
  try {
    await saveWorkspaceModel(tf, model, {
      ...trainingMetadata,
      savedToWorkspace: true,
    })
    savedToWorkspace = true
  } catch (error) {
    console.warn("Unable to save the sales model in this browser:", error)
  } finally {
    model.dispose()
  }

  return {
    forecast,
    backtest,
    metrics: { ...metrics, baselineWape },
    epochs: epochMetrics,
    trainedAt,
    savedToWorkspace,
    actualTrainingExamples: makeExamples(values, fullScale).features.length,
    syntheticTrainingExamples: SYNTHETIC_TRAINING_EXAMPLES,
    trainingDataVersion: SALES_TRAINING_DATA_VERSION,
  }
}

export async function loadSavedSalesForecast(history: SalesHistoryPoint[]) {
  try {
    const tf = await import("@tensorflow/tfjs")
    await initializeTensorFlow(tf)
    const loaded = await loadWorkspaceLayersModel(tf)
    if (!loaded) return null
    if (
      loaded.training.trainingDataVersion !== SALES_TRAINING_DATA_VERSION ||
      history.length < FORECAST_MIN_HISTORY_DAYS
    ) {
      loaded.model.dispose()
      return null
    }
    const forecast = await predict(
      tf,
      loaded.model,
      history.slice(-FORECAST_LOOKBACK_DAYS).map((day) => day.sales),
      loaded.training.scale
    )
    loaded.model.dispose()
    return { ...loaded.training, forecast, savedToWorkspace: true }
  } catch (error) {
    console.error("Unable to load the saved workspace sales model:", error)
    throw error instanceof Error
      ? error
      : new Error("Unable to load the saved workspace sales model.")
  }
}

export async function loadSavedSalesTraining(history: SalesHistoryPoint[]) {
  try {
    const tf = await import("@tensorflow/tfjs")
    await initializeTensorFlow(tf)
    const loaded = await loadWorkspaceLayersModel(tf)
    if (!loaded) return null
    loaded.model.dispose()
    if (
      loaded.training.trainingDataVersion !== SALES_TRAINING_DATA_VERSION ||
      loaded.training.signature !== historySignature(history)
    )
      return null
    return loaded.training
  } catch {
    return null
  }
}
