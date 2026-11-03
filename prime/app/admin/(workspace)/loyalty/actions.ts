"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"

const rewardSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]),
  name: z.string().trim().min(1, "Enter a reward name.").max(150),
  pointsCost: z.coerce.number().int().min(1).max(2_147_483_647),
  description: z.string().trim().max(2000),
  isActive: z.boolean(),
})
const uuidSchema = z.string().uuid()

function refreshCustomerManagement() {
  revalidatePath("/admin/loyalty")
  revalidatePath("/admin/orders")
}

export async function saveLoyaltyReward(data: FormData) {
  const parsed = rewardSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    pointsCost: String(data.get("pointsCost") ?? ""),
    description: String(data.get("description") ?? ""),
    isActive: data.get("isActive") === "true",
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the reward details.",
    }
  try {
    const repository = (await getInitializedDataSource()).getRepository(
      LoyaltyReward
    )
    const reward = parsed.data.id
      ? await repository.findOneBy({ id: parsed.data.id })
      : repository.create({ id: randomUUID() })
    if (!reward)
      return { ok: false, message: "Reward not found. Refresh and try again." }
    reward.name = parsed.data.name
    reward.pointsCost = parsed.data.pointsCost
    reward.description = parsed.data.description || null
    reward.isActive = parsed.data.isActive
    await repository.save(reward)
    refreshCustomerManagement()
    return { ok: true, message: "Reward saved." }
  } catch (error) {
    console.error("Unable to save loyalty reward:", error)
    return {
      ok: false,
      message:
        "Could not save the reward. Check the database connection and try again.",
    }
  }
}

export async function setLoyaltyRewardActive(id: string, active: boolean) {
  if (!uuidSchema.safeParse(id).success)
    return { ok: false, message: "Invalid reward." }
  try {
    const repository = (await getInitializedDataSource()).getRepository(
      LoyaltyReward
    )
    const reward = await repository.findOneBy({ id })
    if (!reward)
      return { ok: false, message: "Reward not found. Refresh and try again." }
    reward.isActive = active
    await repository.save(reward)
    refreshCustomerManagement()
    return {
      ok: true,
      message: active ? "Reward activated." : "Reward deactivated.",
    }
  } catch (error) {
    console.error("Unable to update loyalty reward:", error)
    return {
      ok: false,
      message:
        "Could not update the reward. Check the database connection and try again.",
    }
  }
}

export async function redeemLoyaltyReward(
  customerId: string,
  rewardId: string
) {
  if (
    !uuidSchema.safeParse(customerId).success ||
    !uuidSchema.safeParse(rewardId).success
  )
    return { ok: false, message: "Select a valid customer and reward." }
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const customers = manager.getRepository(Customer)
      const customer = await customers
        .createQueryBuilder("customer")
        .setLock("pessimistic_write")
        .where("customer.id = :id", { id: customerId })
        .getOne()
      if (!customer)
        throw new Error("Customer not found. Refresh and try again.")
      const rewards = manager.getRepository(LoyaltyReward)
      const reward = await rewards
        .createQueryBuilder("reward")
        .setLock("pessimistic_write")
        .where("reward.id = :id", { id: rewardId })
        .getOne()
      if (!reward || !reward.isActive)
        throw new Error("This reward is no longer available.")
      if (customer.loyaltyPointsBalance < reward.pointsCost)
        throw new Error(
          "The customer does not have enough points for this reward."
        )

      customer.loyaltyPointsBalance -= reward.pointsCost
      customer.updatedAt = new Date()
      await customers.save(customer)
      await manager.getRepository(LoyaltyTransaction).save(
        manager.getRepository(LoyaltyTransaction).create({
          id: randomUUID(),
          customerId: customer.id,
          orderId: null,
          type: "redeem",
          points: -reward.pointsCost,
          balanceAfter: customer.loyaltyPointsBalance,
          rewardId: reward.id,
          rewardName: reward.name,
        })
      )
      return { customerName: customer.name, rewardName: reward.name }
    })
    refreshCustomerManagement()
    return {
      ok: true,
      message: `${result.rewardName} redeemed for ${result.customerName}.`,
    }
  } catch (error) {
    console.error("Unable to redeem loyalty reward:", error)
    const message = error instanceof Error ? error.message : ""
    const known =
      message === "Customer not found. Refresh and try again." ||
      message === "This reward is no longer available." ||
      message === "The customer does not have enough points for this reward."
    return {
      ok: false,
      message: known
        ? message
        : "Could not redeem the reward. Check the database connection and try again.",
    }
  }
}
