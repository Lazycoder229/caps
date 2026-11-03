import Link from "next/link"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { Order } from "@/lib/database/entities/entities/Order"
import { LoyaltyReward } from "@/lib/database/entities/entities/LoyaltyReward"
import { LoyaltyTransaction } from "@/lib/database/entities/entities/LoyaltyTransaction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value
  )

export default async function CustomerDashboardPage() {
  const customer = await requireCustomerSession()
  const source = await getInitializedDataSource()
  const [orders, rewards, earnSummary, completedOrders] = await Promise.all([
    source.getRepository(Order).find({
      where: { customerId: customer.id },
      order: { createdAt: "DESC" },
      take: 5,
    }),
    source.getRepository(LoyaltyReward).countBy({ isActive: true }),
    source
      .getRepository(LoyaltyTransaction)
      .createQueryBuilder("transaction")
      .select("COALESCE(SUM(transaction.points), 0)", "earned")
      .where("transaction.customerId = :customerId", {
        customerId: customer.id,
      })
      .andWhere("transaction.type = :type", { type: "earn" })
      .getRawOne<{ earned: string }>(),
    source
      .getRepository(Order)
      .countBy({ customerId: customer.id, status: "completed" }),
  ])

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Customer dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hi, {customer.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order, track your meals, and use your loyalty rewards.
          </p>
        </div>
        <Button asChild>
          <Link href="/customer/kiosk">Start an order</Link>
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Points available"
          value={new Intl.NumberFormat("en-PH").format(
            customer.loyaltyPointsBalance
          )}
          suffix="pts"
        />
        <Metric
          label="Points accumulated"
          value={new Intl.NumberFormat("en-PH").format(
            Number(earnSummary?.earned ?? 0)
          )}
          suffix="pts"
        />
        <Metric label="Completed orders" value={String(completedOrders)} />
        <Metric label="Rewards available" value={String(rewards)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card size="sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">Recent orders</h2>
                <p className="text-xs text-muted-foreground">
                  Your latest activity
                </p>
              </div>
              <Link
                href="/customer/orders"
                className="text-sm font-medium underline underline-offset-4"
              >
                View history
              </Link>
            </div>
            {orders.length ? (
              <div className="divide-y">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href="/customer/orders"
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeZone: "Asia/Manila",
                        }).format(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {money(Number(order.total))}
                      </span>
                      <Badge
                        variant={
                          order.status === "cancelled"
                            ? "destructive"
                            : order.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyMessage
                title="No orders yet"
                detail="Your orders will show here after you place one."
                href="/customer/kiosk"
                action="Browse menu"
              />
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="grid gap-3 p-4">
            <h2 className="font-semibold">Loyalty rewards</h2>
            <p className="text-sm text-muted-foreground">
              Earn points when a paid order is completed. Redeem your points for
              the rewards configured by PRIME.
            </p>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Your current balance
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {new Intl.NumberFormat("en-PH").format(
                  customer.loyaltyPointsBalance
                )}{" "}
                pts
              </p>
            </div>
            <Link
              href="/customer/rewards"
              className="text-sm font-medium underline underline-offset-4"
            >
              Browse rewards and redemptions
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {value}
          {suffix ? (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  )
}

function EmptyMessage({
  title,
  detail,
  href,
  action,
}: {
  title: string
  detail: string
  href: string
  action: string
}) {
  return (
    <div className="grid justify-items-center gap-2 px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
      <Link
        href={href}
        className="mt-2 text-sm font-medium underline underline-offset-4"
      >
        {action}
      </Link>
    </div>
  )
}
