"use client"

import { useActionState } from "react"
import { saveSystemSettings } from "../actions"
import { initialSettingsActionState } from "../types"

export function useSettings() {
  const [state, formAction, pending] = useActionState(
    saveSystemSettings,
    initialSettingsActionState
  )

  return { state, formAction, pending }
}
