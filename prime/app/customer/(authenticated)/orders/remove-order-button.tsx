"use client"

import { useEffect, useState, useTransition } from "react"
import { Trash2, X } from "lucide-react"
import { removeCustomerOrderFromHistory } from "@/app/customer/actions"
import { Button } from "@/components/ui/button"

export function RemoveOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string
  orderNumber: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!confirmOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setConfirmOpen(false)
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [confirmOpen, pending])

  function removeOrder() {
    setMessage("")
    startTransition(async () => {
      const result = await removeCustomerOrderFromHistory(orderId)
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      window.location.reload()
    })
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" />
        Remove from history
      </Button>
      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-order-title"
            aria-describedby="remove-order-description"
            className="w-full max-w-sm rounded-xl border bg-background p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="remove-order-title" className="font-semibold">
                  Remove order from history?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orderNumber}
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Close confirmation"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                <X />
              </Button>
            </div>
            <p
              id="remove-order-description"
              className="mt-3 text-sm text-muted-foreground"
            >
              This hides the order from your history. The restaurant’s payment
              and accounting records are kept.
            </p>
            {message ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                Keep order
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={removeOrder}
              >
                {pending ? "Removing…" : "Remove order"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
