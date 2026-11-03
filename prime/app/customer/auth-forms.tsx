"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { loginCustomer, registerCustomer } from "./auth-actions"

export function CustomerLoginForm({ returnTo = "" }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(loginCustomer, null)
  return (
    <form action={action} className="grid gap-4">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          autoComplete="email"
          type="email"
          name="email"
          required
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <PasswordInput
          autoComplete="current-password"
          name="password"
          required
          className={inputClass}
        />
      </label>
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 bg-[#ff9900] font-semibold text-black hover:bg-[#ed8e00]"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href={`/customer/register${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function CustomerRegisterForm({ returnTo = "" }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(registerCustomer, null)
  return (
    <form action={action} className="grid gap-4">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <label className="grid gap-1.5 text-sm font-medium">
        Full name
        <input
          autoComplete="name"
          name="name"
          required
          maxLength={100}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          autoComplete="email"
          type="email"
          name="email"
          required
          maxLength={255}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Mobile number{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          autoComplete="tel"
          name="contactNumber"
          maxLength={20}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <PasswordInput
          autoComplete="new-password"
          name="password"
          required
          minLength={8}
          maxLength={100}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Confirm password
        <PasswordInput
          autoComplete="new-password"
          name="confirmPassword"
          required
          minLength={8}
          maxLength={100}
          className={inputClass}
        />
      </label>
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 bg-[#ff9900] font-semibold text-black hover:bg-[#ed8e00]"
        disabled={pending}
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href={`/customer/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

const inputClass =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#ff9900]/50"
