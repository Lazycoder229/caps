import dataset from "./prime-pos-chatbot-dataset.json"
import { CHATBOT_DATASET_VERSION } from "./dataset-version"
import {
  getChatbotAnswerForLabel,
  getChatbotKnowledgeEntries,
  type ChatbotRole,
} from "./prime-pos-knowledge"

const MODEL_ENDPOINT = "/api/chatbot/model"
export { CHATBOT_DATASET_VERSION } from "./dataset-version"
type TensorFlowModule = typeof import("@tensorflow/tfjs")
type LayersModel = import("@tensorflow/tfjs").LayersModel

export type ChatbotEpochMetric = {
  epoch: number
  loss: number
  accuracy: number
  validationLoss: number
  validationAccuracy: number
}

export type ChatbotTrainingMetadata = {
  datasetVersion: number
  trainedAt: string
  epochs: number
  sampleCount: number
  intentCount: number
  vocabulary: string[]
  labels: string[]
  loss: number
  accuracy: number
  validationLoss: number
  validationAccuracy: number
}

type TrainingExample = { label: string; text: string }
type LoadedClassifier = {
  model: LayersModel
  metadata: ChatbotTrainingMetadata
}

let cachedClassifier: LoadedClassifier | null = null
let loadingClassifier: Promise<LoadedClassifier | null> | null = null

function tokenize(value: string) {
  const words = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
  const bigrams = words.slice(1).map((word, index) => `${words[index]}_${word}`)
  return [...words, ...bigrams]
}

function toFeatures(text: string, vocabularyIndex: Map<string, number>) {
  const vector = new Array(vocabularyIndex.size).fill(0)
  for (const token of tokenize(text)) {
    const index = vocabularyIndex.get(token)
    if (index !== undefined) vector[index] = 1
  }
  return vector
}

function getTrainingExamples(): TrainingExample[] {
  return getChatbotKnowledgeEntries().flatMap((entry) =>
    entry.examples.map((text) => ({ label: entry.label, text }))
  )
}

function encodeBase64(bytes: Uint8Array) {
  let binary = ""
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, Math.min(index + chunkSize, bytes.length))
    )
  }
  return btoa(binary)
}

function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

async function initializeTensorFlow(tf: TensorFlowModule) {
  try {
    if (!(await tf.setBackend("webgl"))) await tf.setBackend("cpu")
  } catch {
    await tf.setBackend("cpu")
  }
  await tf.ready()
}

export async function trainChatbotIntentModel(
  epochs: number,
  onEpoch: (metric: ChatbotEpochMetric) => void
) {
  const tf = await import("@tensorflow/tfjs")
  await initializeTensorFlow(tf)

  const examples = getTrainingExamples()
  const labels = [...new Set(examples.map((example) => example.label))].sort()
  const vocabulary = [
    ...new Set(examples.flatMap((example) => tokenize(example.text))),
  ].sort()
  if (labels.length < 2 || vocabulary.length === 0)
    throw new Error("The chatbot training dataset needs more examples.")

  const vocabularyIndex = new Map(
    vocabulary.map((token, index) => [token, index])
  )
  const labelIndex = new Map(labels.map((label, index) => [label, index]))
  const trainX: number[][] = []
  const trainY: number[][] = []
  const validationX: number[][] = []
  const validationY: number[][] = []
  const groupPosition = new Map<string, number>()

  for (const example of examples) {
    const position = groupPosition.get(example.label) ?? 0
    groupPosition.set(example.label, position + 1)
    const target = new Array(labels.length).fill(0)
    target[labelIndex.get(example.label)!] = 1
    if (position % 5 === 0) {
      validationX.push(toFeatures(example.text, vocabularyIndex))
      validationY.push(target)
    } else {
      trainX.push(toFeatures(example.text, vocabularyIndex))
      trainY.push(target)
    }
  }
  if (!validationX.length) {
    validationX.push(...trainX.splice(-1))
    validationY.push(...trainY.splice(-1))
  }

  const xTrain = tf.tensor2d(trainX)
  const yTrain = tf.tensor2d(trainY)
  const xValidation = tf.tensor2d(validationX)
  const yValidation = tf.tensor2d(validationY)
  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      inputShape: [vocabulary.length],
      units: 48,
      activation: "relu",
    })
  )
  model.add(tf.layers.dropout({ rate: 0.15 }))
  model.add(tf.layers.dense({ units: labels.length, activation: "softmax" }))
  model.compile({
    optimizer: tf.train.adam(0.008),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  })

  try {
    const history = await model.fit(xTrain, yTrain, {
      epochs,
      batchSize: 16,
      shuffle: true,
      validationData: [xValidation, yValidation],
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          onEpoch({
            epoch: epoch + 1,
            loss: Number(logs?.loss ?? 0),
            accuracy: Number(logs?.acc ?? logs?.accuracy ?? 0),
            validationLoss: Number(logs?.val_loss ?? 0),
            validationAccuracy: Number(
              logs?.val_acc ?? logs?.val_accuracy ?? 0
            ),
          })
        },
      },
    })
    const lastMetric = history.history
    const last = (key: string) => {
      const value = lastMetric[key]?.at(-1)
      return typeof value === "number" ? value : 0
    }
    const trainedAt = new Date().toISOString()
    const metadata: ChatbotTrainingMetadata = {
      datasetVersion: CHATBOT_DATASET_VERSION,
      trainedAt,
      epochs,
      sampleCount: examples.length,
      intentCount: labels.length,
      vocabulary,
      labels,
      loss: last("loss"),
      accuracy: last("acc") || last("accuracy"),
      validationLoss: last("val_loss"),
      validationAccuracy: last("val_acc") || last("val_accuracy"),
    }

    await model.save(
      tf.io.withSaveHandler(async (artifacts) => {
        if (!artifacts.weightData)
          throw new Error("Trained chatbot model weights are missing.")
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
            weightDataBase64: encodeBase64(weightBytes),
            training: metadata,
          }),
        })
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as {
            message?: string
          } | null
          throw new Error(
            result?.message ?? "Could not save chatbot model to workspace."
          )
        }
        return {
          modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
        }
      })
    )

    cachedClassifier?.model.dispose()
    cachedClassifier = { model, metadata }
    return {
      metadata,
      savedToWorkspace: true,
    }
  } catch (error) {
    model.dispose()
    throw error
  } finally {
    xTrain.dispose()
    yTrain.dispose()
    xValidation.dispose()
    yValidation.dispose()
  }
}

export async function loadSavedChatbotModel() {
  const response = await fetch(MODEL_ENDPOINT, { cache: "no-store" })
  if (response.status === 404) return null
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(result?.message ?? "Could not load saved chatbot model.")
  }
  const result = (await response.json()) as {
    modelArtifacts: Record<string, unknown>
    weightDataBase64: string
    training: ChatbotTrainingMetadata
  }
  return result.training
}

async function getClassifier(): Promise<LoadedClassifier | null> {
  if (cachedClassifier) return cachedClassifier
  if (loadingClassifier) return loadingClassifier
  loadingClassifier = (async () => {
    const response = await fetch(MODEL_ENDPOINT, { cache: "no-store" })
    if (response.status === 404) return null
    if (!response.ok) return null
    const result = (await response.json()) as {
      modelArtifacts: Record<string, unknown>
      weightDataBase64: string
      training: ChatbotTrainingMetadata
    }
    if (result.training.datasetVersion !== CHATBOT_DATASET_VERSION) return null

    const tf = await import("@tensorflow/tfjs")
    await initializeTensorFlow(tf)
    const model = await tf.loadLayersModel({
      load: async () => ({
        ...result.modelArtifacts,
        weightData: decodeBase64(result.weightDataBase64),
      }),
    } as Parameters<TensorFlowModule["loadLayersModel"]>[0])
    cachedClassifier = { model, metadata: result.training }
    return cachedClassifier
  })()
  try {
    return await loadingClassifier
  } finally {
    loadingClassifier = null
  }
}

export async function answerWithChatbotModel(
  role: ChatbotRole,
  question: string
) {
  const classifier = await getClassifier()
  if (!classifier) return null
  const vocabularyIndex = new Map(
    classifier.metadata.vocabulary.map((token, index) => [token, index])
  )
  const input = (await import("@tensorflow/tfjs")).tensor2d([
    toFeatures(question, vocabularyIndex),
  ])
  try {
    const output = classifier.model.predict(
      input
    ) as import("@tensorflow/tfjs").Tensor
    try {
      const scores = await output.data()
      let bestIndex = 0
      for (let index = 1; index < scores.length; index++) {
        if (scores[index] > scores[bestIndex]) bestIndex = index
      }
      const confidence = scores[bestIndex] ?? 0
      if (confidence < 0.35) return null
      return getChatbotAnswerForLabel(
        role,
        classifier.metadata.labels[bestIndex] ?? ""
      )
    } finally {
      output.dispose()
    }
  } finally {
    input.dispose()
  }
}

export const CHATBOT_TRAINING_COUNTS = {
  sampleCount: getTrainingExamples().length,
  intentCount: getChatbotKnowledgeEntries().length,
  menuItemCount: dataset.databaseSnapshot.menuItems.length,
}
