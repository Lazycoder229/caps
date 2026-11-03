"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  deleteDiscountType,
  deletePromotion,
  saveDiscountType,
  savePromotion,
  setDiscountActive,
  setPromotionActive,
} from "../actions"

export function useDiscounts() {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [pending, startTransition] = useTransition()

  async function run(task: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      try {
        const result = await task()
        toast(result.ok ? "success" : "error", result.message)
        if (result.ok) router.refresh()
      } catch {
        toast(
          "error",
          "Action failed",
          "Check the database connection and try again."
        )
      }
    })
  }

  function saveDiscount(
    data: FormData
  ): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await saveDiscountType(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast("error", "Could not save discount", "Try again.")
          resolve({ ok: false, message: "Could not save discount." })
        }
      })
    )
  }

  function savePromo(
    data: FormData
  ): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) =>
      startTransition(async () => {
        try {
          const result = await savePromotion(data)
          toast(result.ok ? "success" : "error", result.message)
          if (result.ok) router.refresh()
          resolve(result)
        } catch {
          toast("error", "Could not save promotion", "Try again.")
          resolve({ ok: false, message: "Could not save promotion." })
        }
      })
    )
  }

  async function removeDiscount(id: string, name: string) {
    if (
      !(await confirm({
        title: "Delete discount?",
        description: `Delete ${name}? Discounts used in order history cannot be deleted.`,
        confirmLabel: "Delete discount",
        destructive: true,
      }))
    )
      return
    void run(() => deleteDiscountType(id))
  }

  async function removePromotion(id: string, name: string) {
    if (
      !(await confirm({
        title: "Delete promotion?",
        description: `Delete ${name}? Promotions used in order history cannot be deleted.`,
        confirmLabel: "Delete promotion",
        destructive: true,
      }))
    )
      return
    void run(() => deletePromotion(id))
  }

  return {
    pending,
    saveDiscount,
    savePromo,
    toggleDiscount: (id: string, active: boolean) =>
      run(() => setDiscountActive(id, active)),
    togglePromotion: (id: string, active: boolean) =>
      run(() => setPromotionActive(id, active)),
    removeDiscount,
    removePromotion,
  }
}
