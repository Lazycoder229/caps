"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  closePayrollPeriod,
  deletePayrollPeriod,
  generatePayroll,
} from "../actions"

export function usePayroll() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  function generate(month: string, payday: "5" | "20", silent = false) {
    startTransition(async () => {
      try {
        const result = await generatePayroll(month, payday)
        if (!silent || !result.ok)
          toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        if (!silent)
          toast(
            "error",
            "Payroll generation failed",
            "Check the database and attendance data."
          )
      }
    })
  }
  async function close(periodId: string, label: string) {
    const approved = await confirm({
      title: "Close this payroll period?",
      description: `${label} will be locked. Attendance changes will no longer update its payroll records.`,
      confirmLabel: "Close payroll",
      destructive: true,
    })
    if (!approved) return
    startTransition(async () => {
      try {
        const result = await closePayrollPeriod(periodId)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not close payroll", "Try again.")
      }
    })
  }
  async function remove(periodId: string, label: string) {
    const approved = await confirm({
      title: "Delete this payroll period?",
      description: `${label} and all of its employee payroll records will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete payroll",
    })
    if (!approved) return
    startTransition(async () => {
      try {
        const result = await deletePayrollPeriod(periodId)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not delete payroll", "Try again.")
      }
    })
  }
  return { pending, generate, close, remove }
}
