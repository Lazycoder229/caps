"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import { requestOrderVoid, resolveOrderVoid } from "../actions"

export function useVoids() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function request(data: FormData): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await requestOrderVoid(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not submit void request",
            "Check the connection and try again."
          )
          resolve({ ok: false, message: "Could not submit void request." })
        }
      })
    )
  }

  async function resolve(
    id: string,
    status: "approved" | "rejected",
    notes: string
  ) {
    const approved = await confirm({
      title: status === "approved" ? "Approve this void?" : "Reject this void?",
      description:
        status === "approved"
          ? "The order will be marked cancelled and removed from active service. Stock is restored only if it was consumed for an active order."
          : "The order will remain unchanged and the void request will be marked rejected.",
      confirmLabel: status === "approved" ? "Approve void" : "Reject void",
      destructive: status === "approved",
    })
    if (!approved) return
    const data = new FormData()
    data.set("id", id)
    data.set("status", status)
    data.set("resolutionNotes", notes)
    startTransition(async () => {
      try {
        const result = await resolveOrderVoid(data)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not resolve void request", "Try again.")
      }
    })
  }

  return { pending, request, resolve }
}
