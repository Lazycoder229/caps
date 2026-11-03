"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import { deleteRole, saveRole } from "../actions"

export function useRoles() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function save(data: FormData) {
    return new Promise<{ ok: boolean; message: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await saveRole(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast(
            "error",
            "Could not save role",
            "Check the database and try again."
          )
          resolve({ ok: false, message: "Could not save role." })
        }
      })
    })
  }

  async function remove(role: { id: string; name: string }) {
    if (
      !(await confirm({
        title: "Delete role?",
        description: `Delete ${role.name}? Only unassigned custom roles can be deleted.`,
        confirmLabel: "Delete role",
        destructive: true,
      }))
    )
      return
    startTransition(async () => {
      try {
        const result = await deleteRole(role.id)
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast(
          "error",
          "Could not delete role",
          "Check the database and try again."
        )
      }
    })
  }

  return { pending, save, remove }
}
