export type CustomerRow = {
  id: string
  name: string
  email: string | null
  contactNumber: string | null
  pointsBalance: number
  isGuest: boolean
  createdAt: string
  orderCount: number
}

export type RewardRow = {
  id: string
  name: string
  pointsCost: number
  description: string | null
  isActive: boolean
  redemptionCount: number
}

export type LoyaltyTransactionRow = {
  id: string
  customerName: string
  type: "earn" | "redeem"
  points: number
  balanceAfter: number
  rewardName: string | null
  orderNumber: string | null
  createdAt: string
}
