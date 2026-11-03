"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  redeemLoyaltyReward,
  saveLoyaltyReward,
  setLoyaltyRewardActive,
} from "../actions"

export function useCustomerManagement() {
  const router = useRouter()
  const { toast } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  function run(task: () => Promise<{ ok: boolean; message: string }>) {
    return new Promise<boolean>((resolve) =>
      startTransition(async () => {
        try {
          const result = await task()
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result.ok)
        } catch {
          toast("error", "Action failed", "Check the connection and try again.")
          resolve(false)
        }
      })
    )
  }

  return {
    pending,
    saveReward: (data: FormData) => run(() => saveLoyaltyReward(data)),
    setRewardActive: (id: string, active: boolean) =>
      run(() => setLoyaltyRewardActive(id, active)),
    redeem: (customerId: string, rewardId: string) =>
      run(() => redeemLoyaltyReward(customerId, rewardId)),
  }
}
