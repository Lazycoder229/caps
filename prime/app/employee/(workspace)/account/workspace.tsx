"use client"

import { useActionState } from "react"
import { AlertCircle, Check, KeyRound, Save, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { updateEmployeeAccount, type EmployeeAccountState } from "@/app/employee/actions"

const inputClassName = "h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
const labelClassName = "grid gap-1.5 text-sm font-medium"

export function EmployeeAccountForm({
  name,
  email,
  contactNumber,
}: {
  name: string
  email: string
  contactNumber: string
}) {
  const [state, action, pending] = useActionState<EmployeeAccountState, FormData>(
    updateEmployeeAccount,
    null
  )
  return (
    <form action={action} className="grid overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-2">
      <section className="p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            <UserRound className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Personal information</h2>
            <p className="text-xs text-muted-foreground">Your contact and login details.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <label className={labelClassName}>
            Full name
            <input name="name" required maxLength={100} defaultValue={name} autoComplete="name" className={inputClassName} />
          </label>
          <label className={labelClassName}>
            Email address
            <input name="email" type="email" required maxLength={255} defaultValue={email} autoComplete="email" className={inputClassName} />
          </label>
          <label className={labelClassName}>
            Contact number <span className="font-normal text-muted-foreground">(optional)</span>
            <input name="contactNumber" maxLength={20} defaultValue={contactNumber} autoComplete="tel" placeholder="09XX XXX XXXX" className={inputClassName} />
          </label>
        </div>
      </section>

      <section className="border-t bg-muted/20 p-3 sm:p-4 md:border-l md:border-t-0">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            <KeyRound className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Sign-in security</h2>
            <p className="text-xs text-muted-foreground">Leave blank to keep your password.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <label className={labelClassName}>
            Current password
            <PasswordInput name="currentPassword" autoComplete="current-password" placeholder="Enter current password" className={inputClassName} />
          </label>
          <label className={labelClassName}>
            New password
            <PasswordInput name="newPassword" autoComplete="new-password" minLength={8} maxLength={100} placeholder="At least 8 characters" className={inputClassName} />
          </label>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 md:col-span-2">
        <div aria-live="polite" className="min-h-5 text-sm">
          {state?.message ? (
            <p role={state.ok ? "status" : "alert"} className={`flex items-center gap-2 ${state.ok ? "text-emerald-700" : "text-destructive"}`}>
              {state.ok ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
              {state.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={pending} className="w-full gap-2 sm:w-auto">
          <Save className="size-4" />
          {pending ? "Saving changes…" : "Save changes"}
        </Button>
      </footer>
    </form>
  )
}
