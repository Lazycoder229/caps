"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { submitCustomerPaymentReference } from "../actions"

export function CustomerReferenceForm({
  token,
  savedReference,
}: {
  token: string
  savedReference: string | null
}) {
  const [reference, setReference] = useState(savedReference ?? "")
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setSuccess(false)
    startTransition(async () => {
      const result = await submitCustomerPaymentReference(token, reference)
      setMessage(result.message)
      setSuccess(result.ok)
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border p-5">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Transaction reference number</span>
        <input
          autoComplete="off"
          required
          maxLength={100}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          placeholder="Enter the reference from your payment app"
        />
      </label>
      {message ? (
        <p role={success ? "status" : "alert"} className="text-sm">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending
          ? "Submitting…"
          : savedReference
            ? "Update reference"
            : "Submit reference"}
      </Button>
    </form>
  )
}
