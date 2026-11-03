"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ToastKind = "success" | "error" | "warning" | "info"
type ToastEntry = {
  id: number
  kind: ToastKind
  title: string
  description?: string
}
type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}
type ConfirmEntry = ConfirmOptions & { resolve: (confirmed: boolean) => void }
type Feedback = {
  toast: (kind: ToastKind, title: string, description?: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<Feedback | null>(null)
const toastStyles: Record<
  ToastKind,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-background text-emerald-700 dark:text-emerald-400",
  },
  error: {
    icon: AlertCircle,
    className: "border-destructive/30 bg-background text-destructive",
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-500/40 bg-background text-amber-800 dark:text-amber-300",
  },
  info: {
    icon: Info,
    className: "border-sky-500/30 bg-background text-sky-700 dark:text-sky-300",
  },
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const [confirmation, setConfirmation] = useState<ConfirmEntry | null>(null)
  const nextId = useRef(0)
  const resolver = useRef<((confirmed: boolean) => void) | null>(null)

  const toast = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++nextId.current
      setToasts((items) => [...items, { id, kind, title, description }])
      window.setTimeout(
        () => setToasts((items) => items.filter((item) => item.id !== id)),
        3000
      )
    },
    []
  )

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false)
        resolver.current = resolve
        setConfirmation({ ...options, resolve })
      }),
    []
  )

  const finishConfirmation = useCallback((accepted: boolean) => {
    resolver.current?.(accepted)
    resolver.current = null
    setConfirmation(null)
  }, [])

  useEffect(() => {
    if (!confirmation) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishConfirmation(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [confirmation, finishConfirmation])

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-14 z-[100] flex flex-col items-center gap-2 px-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => {
          const { icon: Icon, className } = toastStyles[item.kind]
          return (
            <div
              key={item.id}
              role={item.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${className}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                onClick={() =>
                  setToasts((items) =>
                    items.filter((toastItem) => toastItem.id !== item.id)
                  )
                }
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
      {confirmation ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) finishConfirmation(false)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            aria-describedby="admin-confirm-description"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
          >
            <h2 id="admin-confirm-title" className="text-lg font-semibold">
              {confirmation.title}
            </h2>
            <p
              id="admin-confirm-description"
              className="mt-2 text-sm text-muted-foreground"
            >
              {confirmation.description}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => finishConfirmation(false)}
              >
                {confirmation.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                type="button"
                variant={
                  confirmation.destructive === false ? "default" : "destructive"
                }
                onClick={() => finishConfirmation(true)}
              >
                {confirmation.confirmLabel ?? "Delete"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}

export function useAdminFeedback() {
  const value = useContext(FeedbackContext)
  if (!value)
    throw new Error(
      "useAdminFeedback must be used within AdminFeedbackProvider."
    )
  return value
}
