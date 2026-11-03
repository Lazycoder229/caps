import dataset from "./prime-pos-chatbot-dataset.json"

export type ChatbotRole = "admin" | "cashier" | "customer"

type KnowledgeEntry = {
  id: string
  examples: string[]
  answer: string
  link?: string
  linkLabel?: string
}

const knowledge = dataset.roles as Record<ChatbotRole, KnowledgeEntry[]>
const sharedKnowledge = dataset.shared as KnowledgeEntry[]

export function getChatbotKnowledgeEntries() {
  return [
    ...Object.entries(knowledge).flatMap(([role, entries]) =>
      entries.map((entry) => ({ ...entry, label: `${role}:${entry.id}` }))
    ),
    ...sharedKnowledge.map((entry) => ({
      ...entry,
      label: `shared:${entry.id}`,
    })),
  ]
}

export function getChatbotAnswerForLabel(role: ChatbotRole, label: string) {
  const [labelRole, ...idParts] = label.split(":")
  const id = idParts.join(":")
  const entry =
    labelRole === "shared"
      ? sharedKnowledge.find((item) => item.id === id)
      : labelRole === role
        ? knowledge[role].find((item) => item.id === id)
        : undefined
  if (!entry) return null
  return {
    answer: entry.answer,
    link: entry.link,
    linkLabel: entry.linkLabel,
  }
}

const stopWords = new Set([
  "a",
  "about",
  "ang",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "ko",
  "mo",
  "my",
  "ng",
  "of",
  "on",
  "paano",
  "please",
  "sa",
  "the",
  "to",
  "un",
  "what",
  "where",
  "why",
  "with",
  "you",
  "yun",
])

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
}

export function answerPrimePosQuestion(
  role: ChatbotRole,
  question: string
): Pick<KnowledgeEntry, "answer" | "link" | "linkLabel"> | null {
  const query = normalize(question)
  if (!query.length) return null

  const normalizedQuestion = query.join(" ")
  let best: KnowledgeEntry | null = null
  let bestScore = 0

  for (const entry of [...knowledge[role], ...sharedKnowledge]) {
    let score = 0
    for (const example of entry.examples) {
      const exampleWords = normalize(example)
      const normalizedExample = exampleWords.join(" ")
      const overlap = query.filter((word) => exampleWords.includes(word)).length
      const coverage = overlap / Math.max(query.length, 1)
      const exampleCoverage = overlap / Math.max(exampleWords.length, 1)

      score = Math.max(
        score,
        overlap * 2 + coverage + exampleCoverage,
        normalizedQuestion === normalizedExample ? 100 : 0
      )
    }

    if (score > bestScore) {
      best = entry
      bestScore = score
    }
  }

  if (best && bestScore >= 2.5) {
    return {
      answer: best.answer,
      link: best.link,
      linkLabel: best.linkLabel,
    }
  }

  return {
    answer:
      "I can help with Prime POS features for your account. Try asking about " +
      (role === "admin"
        ? "orders, payments, settings, reports, forecast, payroll, or customer rewards."
        : role === "cashier"
          ? "live orders, payments, sales reports, voids, reservations, or menu management."
          : "table QR ordering, payment references, order status, cancellation, receipts, or points."),
  }
}
