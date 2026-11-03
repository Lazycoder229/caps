import type { SystemSettingsInput } from "@/lib/validations/system-settings"

export type SystemSettingsFormValues = SystemSettingsInput

export type SettingsActionState = {
  status: "idle" | "success" | "error"
  message: string
  fieldErrors?: Record<string, string[]>
}

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
  message: "",
}

export type BranchSummary = {
  id: string
  name: string
  code: string
  type: string
  address: string | null
  contactNumber: string | null
  email: string | null
  isMain: boolean
  isActive: boolean
}
