"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import { recordRfidTap } from "../actions"

export function useAttendance() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useAdminFeedback()
  function tap(uid: string) {
    startTransition(async () => {
      try {
        const result = await recordRfidTap(uid)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Attendance failed", "Check the RFID UID and try again.")
      }
    })
  }
  return { pending, tap }
}
