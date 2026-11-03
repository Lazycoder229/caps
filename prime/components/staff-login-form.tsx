"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"

type LoginState = { message: string } | null
type LoginAction = (
  previousState: LoginState,
  formData: FormData
) => Promise<LoginState>

export function StaffLoginForm({
  action,
  portal,
}: {
  action: LoginAction
  portal: "Cashier" | "Admin" | "Employee"
}) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          autoComplete="username"
          type="email"
          name="email"
          required
          maxLength={255}
          className="h-11 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#ff9900]/50"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <PasswordInput
          autoComplete="current-password"
          name="password"
          required
          maxLength={100}
          className="h-11 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#ff9900]/50"
        />
      </label>
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
        {pending ? "Signing in…" : `Sign in to ${portal}`}
      </Button>
    </form>
  )
}
