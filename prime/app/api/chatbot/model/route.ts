import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { getStaffSession } from "@/lib/staff-auth/session"
import { CHATBOT_DATASET_VERSION } from "@/lib/chatbot/dataset-version"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const modelDirectory = path.join(
  process.cwd(),
  "workspace-data",
  "models",
  "prime-chatbot"
)
const modelFile = path.join(modelDirectory, "model.json")
const weightsFile = path.join(modelDirectory, "weights.bin")
const trainingFile = path.join(modelDirectory, "training.json")
const MAX_MODEL_BYTES = 8 * 1024 * 1024

async function isAdministrator() {
  const staff = await getStaffSession()
  return Boolean(
    staff && /^(admin|administrator)$/i.test(staff.roleName.trim())
  )
}

export async function GET() {
  try {
    const [modelJson, weightBytes, trainingJson] = await Promise.all([
      readFile(modelFile, "utf8"),
      readFile(weightsFile),
      readFile(trainingFile, "utf8"),
    ])
    return Response.json(
      {
        modelArtifacts: JSON.parse(modelJson),
        weightDataBase64: weightBytes.toString("base64"),
        training: JSON.parse(trainingJson),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return Response.json(
        { message: "No trained chatbot model yet." },
        { status: 404 }
      )
    console.error("Unable to read the saved PRIME chatbot model:", error)
    return Response.json(
      { message: "Could not load the saved chatbot model." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!(await isAdministrator()))
    return Response.json(
      { message: "Administrator access required." },
      { status: 403 }
    )

  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_MODEL_BYTES * 1.5)
    return Response.json(
      { message: "Model file is too large." },
      { status: 413 }
    )

  try {
    const body = (await request.json()) as {
      modelArtifacts?: Record<string, unknown>
      weightDataBase64?: string
      training?: Record<string, unknown>
    }
    const { modelArtifacts, weightDataBase64, training } = body
    if (
      !modelArtifacts ||
      typeof modelArtifacts !== "object" ||
      !modelArtifacts.modelTopology ||
      !Array.isArray(modelArtifacts.weightSpecs) ||
      typeof weightDataBase64 !== "string" ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(weightDataBase64) ||
      !training ||
      typeof training !== "object" ||
      training.datasetVersion !== CHATBOT_DATASET_VERSION ||
      !Array.isArray(training.vocabulary) ||
      !Array.isArray(training.labels) ||
      typeof training.trainedAt !== "string"
    )
      return Response.json(
        { message: "The chatbot model data is invalid." },
        { status: 400 }
      )

    const weightBytes = Buffer.from(weightDataBase64, "base64")
    if (!weightBytes.byteLength || weightBytes.byteLength > MAX_MODEL_BYTES)
      return Response.json(
        { message: "Model file is too large or empty." },
        { status: 413 }
      )

    await mkdir(modelDirectory, { recursive: true })
    const suffix = randomUUID()
    const temporaryFiles = [
      [`${modelFile}.${suffix}.tmp`, JSON.stringify(modelArtifacts)],
      [`${weightsFile}.${suffix}.tmp`, weightBytes],
      [`${trainingFile}.${suffix}.tmp`, JSON.stringify(training)],
    ] as const
    await Promise.all(
      temporaryFiles.map(([file, contents]) => writeFile(file, contents))
    )
    await Promise.all([
      rename(temporaryFiles[0][0], modelFile),
      rename(temporaryFiles[1][0], weightsFile),
      rename(temporaryFiles[2][0], trainingFile),
    ])
    return Response.json({ ok: true, savedAt: training.trainedAt })
  } catch (error) {
    console.error("Unable to save the PRIME chatbot model:", error)
    return Response.json(
      { message: "Could not save the chatbot model to workspace." },
      { status: 500 }
    )
  }
}
