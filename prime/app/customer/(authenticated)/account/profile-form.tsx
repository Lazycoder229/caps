"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { updateCustomerProfile } from "@/app/customer/actions"

export function CustomerProfileForm({
  name,
  contactNumber,
}: {
  name: string
  contactNumber: string
}) {
  const [state, action, pending] = useActionState(
    async (
      _previous: { ok: boolean; message: string } | null,
      formData: FormData
    ) => updateCustomerProfile(formData),
    null
  )
  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1 text-sm font-medium">
        Full name
        <input
          name="name"
          defaultValue={name}
          required
          maxLength={100}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Mobile number
        <input
          name="contactNumber"
          defaultValue={contactNumber}
          maxLength={20}
          className={inputClass}
        />
      </label>
      {state?.message ? (
        <p
          role="status"
          className={
            state.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  )
}
const inputClass =
  "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
