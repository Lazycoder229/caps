"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { redeemCustomerReward } from "@/app/customer/actions"

export function RedeemButton({
  rewardId,
  disabled,
}: {
  rewardId: string
  disabled: boolean
}) {
  const [state, action, pending] = useActionState(
    async (
      _previous: { ok: boolean; message: string } | null,
      _formData: FormData
    ) => redeemCustomerReward(rewardId),
    null
  )
  return (
    <form action={action} className="mt-auto grid gap-2">
      <Button disabled={disabled || pending} className="w-full">
        {pending
          ? "Redeeming…"
          : disabled
            ? "Not enough points"
            : "Redeem reward"}
      </Button>
      {state?.message ? (
        <p
          role="status"
          className={
            state.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
