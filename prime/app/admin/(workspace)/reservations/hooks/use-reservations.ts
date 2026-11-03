"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  deleteReservation,
  saveReservation,
  updateReservationStatus,
} from "../actions"
import type { ReservationStatus } from "@/lib/database/entities/entities/enums"

export function useReservations() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function save(formData: FormData): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await saveReservation(formData)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not save reservation",
            "Check the connection and try again."
          )
          resolve({ ok: false, message: "Could not save reservation." })
        }
      })
    )
  }

  function setStatus(id: string, status: ReservationStatus) {
    startTransition(async () => {
      try {
        const result = await updateReservationStatus(id, status)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not update reservation", "Try again.")
      }
    })
  }

  async function remove(id: string, name: string) {
    const approved = await confirm({
      title: "Delete this reservation?",
      description: `Delete the reservation for ${name}? This cannot be undone.`,
      confirmLabel: "Delete reservation",
      destructive: true,
    })
    if (!approved) return
    startTransition(async () => {
      try {
        const result = await deleteReservation(id)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not delete reservation", "Try again.")
      }
    })
  }

  return { pending, save, setStatus, remove }
}
