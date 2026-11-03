"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import { saveEmployee, setEmployeeAccountActive } from "../actions"

export function useEmployees() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function save(data: FormData) {
    return new Promise<{ ok: boolean; message: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await saveEmployee(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not save employee",
            "Check the database and try again."
          )
          resolve({ ok: false, message: "Could not save employee." })
        }
      })
    })
  }

  async function toggleAccount(employee: {
    id: string
    name: string
    active: boolean
  }) {
    const action = employee.active ? "deactivate" : "activate"
    if (
      !(await confirm({
        title: `${action[0].toUpperCase()}${action.slice(1)} staff account?`,
        description: `${employee.name} will ${employee.active ? "no longer be able to use" : "be able to use"} this staff account.`,
        confirmLabel: `${action[0].toUpperCase()}${action.slice(1)} account`,
        destructive: employee.active,
      }))
    )
      return
    startTransition(async () => {
      try {
        const result = await setEmployeeAccountActive(
          employee.id,
          !employee.active
        )
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast("error", "Could not update account", "Try again.")
      }
    })
  }

  return { pending, save, toggleAccount }
}
