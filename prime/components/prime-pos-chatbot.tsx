"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  answerPrimePosQuestion,
  type ChatbotRole,
} from "@/lib/chatbot/prime-pos-knowledge"
import { answerWithChatbotModel } from "@/lib/chatbot/tfjs-intent-model"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  from: "assistant" | "user"
  text: string
  link?: string
  linkLabel?: string
}

const roleCopy: Record<
  ChatbotRole,
  { greeting: string; suggestions: string[] }
> = {
  admin: {
    greeting:
      "Hi! I can guide you through Prime POS admin features and workflows. What do you need help with?",
    suggestions: ["How do I set up payments?", "How does sales forecast work?"],
  },
  cashier: {
    greeting:
      "Hi! I can help with cashier tasks like orders, payments, reports, and reservations. What are you looking for?",
    suggestions: [
      "How do I verify an e-wallet payment?",
      "Where are reservations?",
    ],
  },
  customer: {
    greeting:
      "Hi! I can help you order, track a payment, find a receipt, or use rewards. What can I help with?",
    suggestions: ["How do I scan a table QR?", "Where can I see my points?"],
  },
}

export function PrimePosChatbot({ role }: { role: ChatbotRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "assistant", text: roleCopy[role].greeting },
  ])
  const endRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  const customerDashboard =
    role === "customer" && pathname === "/customer/dashboard"
  const customerKiosk =
    role === "customer" && pathname.includes("/customer/kiosk")
  openRef.current = open

  useEffect(() => {
    if (role === "customer") {
      setShowNudge(false)
      if (!customerDashboard) return

      let dismissTimer: number | undefined
      const initialTimer = window.setTimeout(() => {
        if (document.hidden || openRef.current) return
        setShowNudge(true)
        dismissTimer = window.setTimeout(() => setShowNudge(false), 5000)
      }, 900)

      return () => {
        window.clearTimeout(initialTimer)
        if (dismissTimer !== undefined) window.clearTimeout(dismissTimer)
      }
    }

    let hiddenAt: number | null = null
    const initialTimer = window.setTimeout(() => {
      if (!document.hidden) setShowNudge(true)
    }, 900)

    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (
        hiddenAt !== null &&
        Date.now() - hiddenAt >= 20_000 &&
        !openRef.current
      ) {
        setShowNudge(true)
      }
      hiddenAt = null
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.clearTimeout(initialTimer)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [customerDashboard, role])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages, open, typing])

  async function sendMessage(value: string) {
    const text = value.trim()
    if (!text || typing) return
    const id = Date.now()
    setMessages((current) => [...current, { id, from: "user", text }])
    setDraft("")
    setTyping(true)
    try {
      const [modelAnswer] = await Promise.all([
        answerWithChatbotModel(role, text).catch(() => null),
        new Promise((resolve) => window.setTimeout(resolve, 650)),
      ])
      const answer = modelAnswer ?? answerPrimePosQuestion(role, text)
      if (answer) {
        setMessages((current) => [
          ...current,
          {
            id: id + 1,
            from: "assistant",
            text: answer.answer,
            link: answer.link,
            linkLabel: answer.linkLabel,
          },
        ])
      }
    } finally {
      setTyping(false)
    }
  }

  function askSuggestion(suggestion: string) {
    setShowNudge(false)
    setOpen(true)
    sendMessage(suggestion)
  }

  return (
    <div
      className={cn(
        "fixed right-[max(0.75rem,env(safe-area-inset-right))] z-50 flex flex-col items-end gap-3",
        customerKiosk
          ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-4"
          : "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:bottom-4"
      )}
    >
      {showNudge && !open && (role !== "customer" || customerDashboard) && (
        <section
          aria-label="PRIME assistant suggestions"
          className="w-[min(19rem,calc(100vw-2rem))] rounded-2xl border bg-background p-3 shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Need a hand?</p>
              <p className="text-xs text-muted-foreground">
                Ask PRIME, The PRIME POS Assistant.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss PRIME suggestions"
              onClick={() => setShowNudge(false)}
            >
              <X />
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {roleCopy[role].suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => askSuggestion(suggestion)}
                className="rounded-lg border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="PRIME, The PRIME POS Assistant"
          className="flex h-[min(68dvh,38rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-6rem)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:h-[min(76svh,38rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[22rem]"
        >
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">PRIME</p>
                <p className="text-xs text-muted-foreground">
                  The PRIME POS Assistant · {role}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close help chat"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.from === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                    message.from === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted"
                  )}
                >
                  <p>{message.text}</p>
                  {message.link && message.linkLabel && (
                    <Link
                      href={message.link}
                      className="mt-2 inline-flex items-center gap-1 font-medium underline underline-offset-4"
                      onClick={() => setOpen(false)}
                    >
                      {message.linkLabel}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div
                className="flex justify-start"
                aria-label="PRIME is typing"
                role="status"
              >
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <span className="sr-only">PRIME is typing</span>
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}
            {messages.length === 1 &&
              (role !== "customer" || (customerDashboard && showNudge)) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {roleCopy[role].suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      disabled={typing}
                      className="rounded-full border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(draft)
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about Prime POS…"
              aria-label="Ask about Prime POS"
              autoComplete="off"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={!draft.trim() || typing}
            >
              <Send />
            </Button>
          </form>
        </section>
      )}

      <Button
        type="button"
        onClick={() => {
          setShowNudge(false)
          setOpen((value) => !value)
        }}
        className="h-12 gap-2 rounded-full px-4 shadow-lg"
        aria-expanded={open}
        aria-label={open ? "Close PRIME assistant" : "Open PRIME assistant"}
      >
        {open ? <X /> : <MessageCircle />}
        <span>{open ? "Close" : "Ask PRIME"}</span>
      </Button>
    </div>
  )
}
