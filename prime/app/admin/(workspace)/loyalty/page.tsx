import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { Order } from "@/lib/database/entities/entities/Order"
import { LoyaltySetting } from "@/lib/database/entities/entities/LoyaltySetting"
import { CustomerManagement } from "./workspace"
import type { CustomerRow, LoyaltyTransactionRow, RewardRow } from "./types"

export default async function CustomerManagementPage() {
  try {
    const source = await getInitializedDataSource()
    const [customers, rewards, transactions, loyaltySettings] =
      await Promise.all([
        source.getRepository(Customer).find({
          order: { createdAt: "DESC" },
          take: 1000,
        }),
        source.getRepository(LoyaltyReward).find({
          order: { pointsCost: "ASC", name: "ASC" },
        }),
        source.getRepository(LoyaltyTransaction).find({
          relations: { customer: true, order: true },
          order: { createdAt: "DESC" },
          take: 300,
        }),
        source.getRepository(LoyaltySetting).findOne({ where: {} }),
      ])
    const redemptionCountRows = await source
      .getRepository(LoyaltyTransaction)
      .createQueryBuilder("transaction")
      .select("transaction.rewardId", "rewardId")
      .addSelect("COUNT(*)", "count")
      .where("transaction.type = :type", { type: "redeem" })
      .andWhere("transaction.rewardId IS NOT NULL")
      .groupBy("transaction.rewardId")
      .getRawMany<{ rewardId: string; count: string }>()
    const redemptionCounts = new Map(
      redemptionCountRows.map((row) => [row.rewardId, Number(row.count)])
    )
    const orderCountRows = customers.length
      ? await source
          .getRepository(Order)
          .createQueryBuilder("order")
          .select("order.customerId", "customerId")
          .addSelect("COUNT(*)", "count")
          .where("order.customerId IN (:...ids)", {
            ids: customers.map((customer) => customer.id),
          })
          .groupBy("order.customerId")
          .getRawMany<{ customerId: string; count: string }>()
      : []
    const orderCounts = new Map(
      orderCountRows.map((row) => [row.customerId, Number(row.count)])
    )
    const customerRows: CustomerRow[] = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      contactNumber: customer.contactNumber,
      pointsBalance: customer.loyaltyPointsBalance,
      isGuest: customer.isGuest,
      createdAt: customer.createdAt.toISOString(),
      orderCount: orderCounts.get(customer.id) ?? 0,
    }))
    const rewardRows: RewardRow[] = rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      pointsCost: reward.pointsCost,
      description: reward.description,
      isActive: reward.isActive,
      redemptionCount: redemptionCounts.get(reward.id) ?? 0,
    }))
    const transactionRows: LoyaltyTransactionRow[] = transactions.map(
      (transaction) => ({
        id: transaction.id,
        customerName: transaction.customer?.name ?? "Deleted customer",
        type: transaction.type,
        points: transaction.points,
        balanceAfter: transaction.balanceAfter,
        rewardName: transaction.rewardName,
        orderNumber: transaction.order?.orderNumber ?? null,
        createdAt: transaction.createdAt.toISOString(),
      })
    )
    return (
      <CustomerManagement
        customers={customerRows}
        rewards={rewardRows}
        transactions={transactionRows}
        pointsPerTier={Number(loyaltySettings?.pointsPerTier ?? 5)}
      />
    )
  } catch (error) {
    console.error("Unable to load customer management:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Customer Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles, rewards, and loyalty activity.
          </p>
        </header>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect customer management."
            : "Customer data could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
