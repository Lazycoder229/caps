import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { RedeemButton } from "./redeem-button"

export default async function CustomerRewardsPage() {
  const customer = await requireCustomerSession()
  const source = await getInitializedDataSource()
  const [rewards, transactions, earned] = await Promise.all([
    source
      .getRepository(LoyaltyReward)
      .find({ where: { isActive: true }, order: { pointsCost: "ASC" } }),
    source
      .getRepository(LoyaltyTransaction)
      .find({
        where: { customerId: customer.id },
        order: { createdAt: "DESC" },
        take: 100,
      }),
    source
      .getRepository(LoyaltyTransaction)
      .createQueryBuilder("tx")
      .select("COALESCE(SUM(tx.points), 0)", "total")
      .where("tx.customerId = :id", { id: customer.id })
      .andWhere("tx.type = 'earn'")
      .getRawOne<{ total: string }>(),
  ])
  const fmt = new Intl.NumberFormat("en-PH")
  return (
    <main className="w-full space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loyalty</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Points & rewards</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Points are added after a paid order is completed. Redeem an available
          reward using your balance.
        </p>
      </header>
      <section className="grid grid-cols-2 gap-3">
        <Summary
          label="Points accumulated"
          value={fmt.format(Number(earned?.total ?? 0))}
        />
        <Summary
          label="Points remaining"
          value={fmt.format(customer.loyaltyPointsBalance)}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Available redemptions</h2>
        {rewards.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id} size="sm" className="rounded-xl">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug">{reward.name}</h3>
                      {reward.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {reward.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[11px]">
                      {fmt.format(reward.pointsCost)} pts
                    </Badge>
                  </div>
                  <RedeemButton
                    rewardId={reward.id}
                    disabled={customer.loyaltyPointsBalance < reward.pointsCost}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card size="sm">
            <CardContent className="p-4 text-sm text-muted-foreground">
              No rewards are currently configured. Check back later.
            </CardContent>
          </Card>
        )}
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Points activity</h2>
          <p className="text-sm text-muted-foreground">
            Your recent points earned and rewards redeemed.
          </p>
        </div>
        <Card size="sm">
          <CardContent className="divide-y p-0">
            {transactions.length ? (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-3 py-2.5 sm:px-4"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === "earn"
                        ? "Points earned"
                        : tx.rewardName
                          ? `Redeemed: ${tx.rewardName}`
                          : "Points redeemed"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      }).format(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        tx.points > 0
                          ? "font-semibold text-emerald-700"
                          : "font-semibold"
                      }
                    >
                      {tx.points > 0 ? "+" : ""}
                      {fmt.format(tx.points)} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance {fmt.format(tx.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
            <p className="p-4 text-sm text-muted-foreground">
                Your points activity will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" className="rounded-xl">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {value}{" "}
          <span className="text-sm font-normal text-muted-foreground">pts</span>
        </p>
      </CardContent>
    </Card>
  )
}
