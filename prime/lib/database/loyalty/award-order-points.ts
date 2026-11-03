import { randomUUID } from "node:crypto"
import type { EntityManager } from "typeorm"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { LoyaltySetting } from "@/lib/database/entities/entities/LoyaltySetting"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { Order } from "@/lib/database/entities/entities/Order"

/** Credit points only after a paid order reaches completion. */
export async function awardOrderLoyaltyPoints(
  order: Order,
  manager: EntityManager
): Promise<number> {
  if (!order.customerId) return 0
  const settings = await manager.getRepository(LoyaltySetting).findOne({
    where: {},
  })
  const pointsPerTier = Math.max(0, Math.floor(Number(settings?.pointsPerTier ?? 5)))
  const total = Number(order.total)
  const points =
    total < 100
      ? 0
      : pointsPerTier * (total < 200 ? 1 : 2 + Math.floor((total - 200) / 200))
  if (!Number.isFinite(points) || points <= 0) return 0

  const customers = manager.getRepository(Customer)
  const customer = await customers
    .createQueryBuilder("customer")
    .setLock("pessimistic_write")
    .where("customer.id = :id", { id: order.customerId })
    .getOne()
  if (!customer) return 0

  customer.loyaltyPointsBalance += points
  customer.updatedAt = new Date()
  await customers.save(customer)
  await manager.getRepository(LoyaltyTransaction).save(
    manager.getRepository(LoyaltyTransaction).create({
      id: randomUUID(),
      customerId: customer.id,
      orderId: order.id,
      type: "earn",
      points,
      balanceAfter: customer.loyaltyPointsBalance,
      rewardId: null,
      rewardName: null,
    })
  )
  return points
}
