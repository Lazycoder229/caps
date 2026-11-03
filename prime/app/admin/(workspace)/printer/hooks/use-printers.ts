"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import { deletePrinter, savePrinter, setPrinterActive } from "../actions"

export function usePrinters() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function save(data: FormData): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await savePrinter(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not save printer",
            "Check the connection and try again."
          )
          resolve({ ok: false, message: "Could not save printer." })
        }
      })
    )
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        const result = await setPrinterActive(id, active)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not update printer", "Try again.")
      }
    })
  }

  async function remove(id: string, name: string) {
    const approved = await confirm({
      title: "Delete this printer?",
      description: `Delete ${name} from printer settings?`,
      confirmLabel: "Delete printer",
      destructive: true,
    })
    if (!approved) return
    startTransition(async () => {
      try {
        const result = await deletePrinter(id)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not delete printer", "Try again.")
      }
    })
  }

  return { pending, save, toggle, remove }
}
