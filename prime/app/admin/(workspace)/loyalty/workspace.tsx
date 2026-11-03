"use client"

import { useMemo, useState } from "react"
import { Gift, History, Plus, Search, UserRound, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCustomerManagement } from "./hooks/use-customer-management"
import type { CustomerRow, LoyaltyTransactionRow, RewardRow } from "./types"

type Tab = "customers" | "rewards" | "activity"
type RewardDraft = Partial<RewardRow> & { id: string }
const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
const pesoPoints = (value: number) =>
  new Intl.NumberFormat("en-PH").format(value)

export function CustomerManagement({
  customers,
  rewards,
  transactions,
  pointsPerTier,
}: {
  customers: CustomerRow[]
  rewards: RewardRow[]
  transactions: LoyaltyTransactionRow[]
  pointsPerTier: number
}) {
  const [tab, setTab] = useState<Tab>("customers")
  const [query, setQuery] = useState("")
  const [rewardDraft, setRewardDraft] = useState<RewardDraft | null>(null)
  const [redeemCustomer, setRedeemCustomer] = useState<CustomerRow | null>(null)
  const [redeemRewardId, setRedeemRewardId] = useState("")
  const { pending, saveReward, setRewardActive, redeem } =
    useCustomerManagement()

  const filteredCustomers = useMemo(() => {
    const text = query.trim().toLowerCase()
    return customers.filter(
      (customer) =>
        !text ||
        [customer.name, customer.email, customer.contactNumber].some((value) =>
          value?.toLowerCase().includes(text)
        )
    )
  }, [customers, query])
  const filteredRewards = useMemo(() => {
    const text = query.trim().toLowerCase()
    return rewards.filter(
      (reward) =>
        !text ||
        [reward.name, reward.description].some((value) =>
          value?.toLowerCase().includes(text)
        )
    )
  }, [rewards, query])
  const filteredTransactions = useMemo(() => {
    const text = query.trim().toLowerCase()
    return transactions.filter(
      (transaction) =>
        !text ||
        [
          transaction.customerName,
          transaction.rewardName,
          transaction.orderNumber,
        ].some((value) => value?.toLowerCase().includes(text))
    )
  }, [transactions, query])
  const activeRewards = rewards.filter((reward) => reward.isActive)
  const selectedReward = activeRewards.find(
    (reward) => reward.id === redeemRewardId
  )

  async function submitReward(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    data.set(
      "isActive",
      event.currentTarget.querySelector<HTMLInputElement>(
        'input[name="isActive"]'
      )?.checked
        ? "true"
        : "false"
    )
    const saved = await saveReward(data)
    if (saved) setRewardDraft(null)
  }

  async function submitRedemption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!redeemCustomer || !redeemRewardId) return
    const done = await redeem(redeemCustomer.id, redeemRewardId)
    if (done) {
      setRedeemCustomer(null)
      setRedeemRewardId("")
    }
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Customer Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View customer profiles, manage the reward catalog, and process
            redemptions. Paid orders earn {pointsPerTier} points at ₱100,
            {pointsPerTier * 2} at ₱200, {pointsPerTier * 3} at ₱400, then
            add {pointsPerTier} points for every additional ₱200 after completion.
          </p>
        </div>
        {tab === "rewards" ? (
          <Button
            size="sm"
            onClick={() =>
              setRewardDraft({
                id: "",
                name: "",
                pointsCost: 100,
                description: "",
                isActive: true,
              })
            }
          >
            <Plus className="mr-1 size-4" />
            New reward
          </Button>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Customers" value={customers.length} />
        <Summary
          label="Points in circulation"
          value={customers.reduce(
            (total, customer) => total + customer.pointsBalance,
            0
          )}
        />
        <Summary label="Active rewards" value={activeRewards.length} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          className="flex gap-1 rounded-lg border bg-muted/30 p-1"
          aria-label="Customer management sections"
        >
          <TabButton
            active={tab === "customers"}
            onClick={() => {
              setTab("customers")
              setQuery("")
            }}
          >
            <UserRound className="size-4" />
            Customers
          </TabButton>
          <TabButton
            active={tab === "rewards"}
            onClick={() => {
              setTab("rewards")
              setQuery("")
            }}
          >
            <Gift className="size-4" />
            Rewards
          </TabButton>
          <TabButton
            active={tab === "activity"}
            onClick={() => {
              setTab("activity")
              setQuery("")
            }}
          >
            <History className="size-4" />
            Points activity
          </TabButton>
        </nav>
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search customer management"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              tab === "customers"
                ? "Search name, phone, email..."
                : tab === "rewards"
                  ? "Search rewards..."
                  : "Search customer or reward..."
            }
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>

      {tab === "customers" ? (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Points balance</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.email || "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {customer.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {pesoPoints(customer.pointsBalance)} pts
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={customer.isGuest ? "outline" : "secondary"}
                      >
                        {customer.isGuest ? "Guest" : "Member"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            pending ||
                            customer.pointsBalance <= 0 ||
                            !activeRewards.length
                          }
                          onClick={() => {
                            setRedeemCustomer(customer)
                            setRedeemRewardId("")
                          }}
                        >
                          Redeem points
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredCustomers.length ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No customers found"
                        detail="Customer profiles appear here when customers register or place an order."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : tab === "rewards" ? (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Points cost</th>
                  <th className="px-4 py-3 font-medium">Redeemed</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{reward.name}</p>
                      {reward.description ? (
                        <p className="max-w-lg text-xs text-muted-foreground">
                          {reward.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {pesoPoints(reward.pointsCost)} pts
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {reward.redemptionCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={reward.isActive ? "secondary" : "outline"}
                      >
                        {reward.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            void setRewardActive(reward.id, !reward.isActive)
                          }
                        >
                          {reward.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => setRewardDraft(reward)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredRewards.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No rewards yet"
                        detail="Create a reward that customers can redeem using their points."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Balance after</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      }).format(new Date(transaction.createdAt))}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {transaction.customerName}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.type === "earn" ? (
                        <>
                          <span>Order completed</span>
                          {transaction.orderNumber ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {transaction.orderNumber}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span>
                          Redeemed: {transaction.rewardName || "Reward"}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold tabular-nums ${transaction.points < 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {pesoPoints(transaction.points)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {pesoPoints(transaction.balanceAfter)} pts
                    </td>
                  </tr>
                ))}
                {!filteredTransactions.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No points activity yet"
                        detail="Points earned from completed paid orders and reward redemptions will appear here."
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {rewardDraft ? (
        <Dialog
          title={rewardDraft.id ? "Edit reward" : "New reward"}
          onClose={() => setRewardDraft(null)}
        >
          <form onSubmit={submitReward} className="grid gap-3">
            <input type="hidden" name="id" value={rewardDraft.id} />
            <label className="grid gap-1.5 text-sm">
              Reward name
              <input
                autoFocus
                required
                name="name"
                maxLength={150}
                defaultValue={rewardDraft.name ?? ""}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Points cost
              <input
                required
                type="number"
                min={1}
                step={1}
                name="pointsCost"
                defaultValue={rewardDraft.pointsCost ?? 100}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Description
              <textarea
                name="description"
                maxLength={2000}
                defaultValue={rewardDraft.description ?? ""}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={rewardDraft.isActive ?? true}
                className="size-4 accent-primary"
              />
              Available for redemption
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setRewardDraft(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save reward"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}

      {redeemCustomer ? (
        <Dialog
          title={`Redeem points · ${redeemCustomer.name}`}
          onClose={() => setRedeemCustomer(null)}
        >
          <form onSubmit={submitRedemption} className="grid gap-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              Available balance{" "}
              <strong className="ml-1 tabular-nums">
                {pesoPoints(redeemCustomer.pointsBalance)} pts
              </strong>
            </div>
            <label className="grid gap-1.5 text-sm">
              Choose reward
              <select
                required
                value={redeemRewardId}
                onChange={(event) => setRedeemRewardId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a reward</option>
                {activeRewards.map((reward) => (
                  <option
                    key={reward.id}
                    value={reward.id}
                    disabled={redeemCustomer.pointsBalance < reward.pointsCost}
                  >
                    {reward.name} · {pesoPoints(reward.pointsCost)} pts
                    {redeemCustomer.pointsBalance < reward.pointsCost
                      ? " · Not enough points"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            {selectedReward ? (
              <p className="text-sm text-muted-foreground">
                After redemption, balance will be{" "}
                {pesoPoints(
                  redeemCustomer.pointsBalance - selectedReward.pointsCost
                )}{" "}
                pts.
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Confirm that the customer receives the selected reward. Redemption
              immediately deducts points and is recorded in the points activity
              ledger.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setRedeemCustomer(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  pending ||
                  !selectedReward ||
                  selectedReward.pointsCost > redeemCustomer.pointsBalance
                }
              >
                {pending ? "Redeeming…" : "Confirm redemption"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </main>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {pesoPoints(value)}
        </p>
      </CardContent>
    </Card>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
      <Gift className="size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-dialog-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border bg-background p-5 shadow-xl"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 id="customer-dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}
