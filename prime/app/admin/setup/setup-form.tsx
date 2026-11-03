"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { setupFirstAdministrator } from "./actions"

const fieldClass =
  "h-11 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#ff9900]/50"

export function AdminSetupForm() {
  const [state, action, pending] = useActionState(setupFirstAdministrator, null)

  return (
    <form action={action} className="grid gap-4">
      <Field label="Administrator name">
        <input
          autoComplete="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          className={fieldClass}
        />
      </Field>
      <Field label="Email">
        <input
          autoComplete="email"
          type="email"
          name="email"
          required
          maxLength={255}
          className={fieldClass}
        />
      </Field>
      <Field label="Employee number">
        <input
          name="employeeNumber"
          required
          maxLength={20}
          className={fieldClass}
        />
      </Field>
      <Field label="Password (at least 12 characters)">
        <PasswordInput
          autoComplete="new-password"
          name="password"
          required
          minLength={12}
          maxLength={100}
          className={fieldClass}
        />
      </Field>
      <Field label="Confirm password">
        <PasswordInput
          autoComplete="new-password"
          name="confirmPassword"
          required
          minLength={12}
          maxLength={100}
          className={fieldClass}
        />
      </Field>
      <Field label="One-time setup key">
        <PasswordInput
          autoComplete="off"
          name="bootstrapKey"
          required
          maxLength={200}
          className={fieldClass}
        />
      </Field>
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full bg-[#ff9900] font-semibold text-black hover:bg-[#ed8e00]"
        disabled={pending}
      >
        {pending ? "Creating administrator…" : "Create first administrator"}
      </Button>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}
