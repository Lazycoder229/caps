import Constants from "expo-constants"

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0]
const defaultApiUrl = expoHost
  ? `http://${expoHost}:3000`
  : "http://10.0.2.2:3000"

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || defaultApiUrl
).replace(/\/$/, "")

export type Customer = {
  id: string
  name: string
  email: string
  contactNumber: string | null
  loyaltyPointsBalance?: number
  createdAt?: string
}
export type SavedDeliveryAddress = {
  label: "home" | "work"
  recipientName: string
  contactNumber: string
  address: string
  latitude: number | null
  longitude: number | null
  instructions: string | null
  isDefault: boolean
}
export type MenuItem = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  imageUrl: string | null
}
export type Catalog = {
  menu: MenuItem[]
  categories: string[]
  currencySymbol: string
  currencyCode?: string
  tables?: { id: string; tableNumber: string; capacity: number; status: string }[]
  promotions?: { id: string; name: string; promoType: "percentage" | "fixed_amount"; discountValue: number; minSpend: number | null; menuItemIds: string[] }[]
  discounts?: { id: string; name: string; percentage: number; requiresIdVerification: boolean }[]
  paymentMethods?: { id: "cash" | "gcash" | "maya" | "qrph"; label: string; qrImage: string | null }[]
  pricing?: { vatEnabled: boolean; vatRate: number; vatInclusive: boolean; serviceChargeEnabled: boolean; serviceChargeRate: number; requireTableSelection: boolean }
  delivery?: { enabled: boolean; fee: number; minimumOrder: number; serviceAddress: string }
}
export type PortalData = {
  customer: Customer
  deliveryAddresses: SavedDeliveryAddress[]
  orders: { id: string; orderNumber: string; orderType: string; status: string; paymentStatus: string; paymentMethod: string | null; total: number; deliveryFee: number; delivery: { address: string; latitude: number; longitude: number; recipientName: string; recipientPhone: string; instructions: string | null; status: string } | null; discount: number; createdAt: string; paymentReferenceToken: string | null; receiptAvailable: boolean; receiptNumber: string | null; pendingCancellation: boolean; voidStatus: string | null; items: { id: string; name: string; quantity: number; unitPrice: number; subtotal: number; notes: string | null }[] }[]
  reservations: { id: string; reservationDate: string; reservationTime: string; numberOfGuests: number; status: string; notes: string | null; tableNumber: string | null }[]
  rewards: { id: string; name: string; description: string | null; pointsCost: number; isActive: boolean }[]
  transactions: { id: string; type: string; points: number; balanceAfter: number; rewardName: string | null; createdAt: string }[]
  earnedPoints: number
}
export type DigitalReceipt = {
  settings: {
    restaurantName: string; branchName: string; contactNumber: string; email: string; address: string
    tinNumber: string | null; birMin: string | null; currencySymbol: string; currencyCode: string
    vatEnabled: boolean; vatRate: number; vatInclusive: boolean; serviceChargeEnabled: boolean
    serviceChargeRate: number; receiptHeader: string | null; receiptFooter: string | null
    wifiSsid: string | null; wifiPassword?: string; showWifiOnReceipt: boolean
  }
  receipt: {
    receiptNumber: string; date: string; items: { name: string; quantity: number; unitPrice: number }[]
    paymentMethod: string; cashier: string
    totals: { subtotal: number; discount: number; tax: number; serviceCharge: number; deliveryFee: number; total: number }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(data?.error || "Something went wrong. Please try again.")
  return data as T
}

export const api = {
  catalog: (tableId?: string | null) => request<Catalog>(`/api/v1/customer/catalog${tableId ? `?tableId=${encodeURIComponent(tableId)}` : ""}`),
  login: (email: string, password: string) =>
    request<{ token: string; customer: Customer }>(
      "/api/v1/customer/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  register: (input: {
    name: string
    email: string
    contactNumber: string
    password: string
  }) =>
    request<{ token: string; customer: Customer }>(
      "/api/v1/customer/auth/register",
      { method: "POST", body: JSON.stringify(input) }
    ),
  me: (token: string) =>
    request<{ customer: Customer }>("/api/v1/customer/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  portal: (token: string) => request<PortalData>("/api/v1/customer/portal", { headers: { Authorization: `Bearer ${token}` } }),
  portalAction: (token: string, payload: Record<string, unknown>) => request<{ ok: true; message: string }>("/api/v1/customer/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  createOrder: (token: string | null, payload: Record<string, unknown>) => request<{ ok: boolean; message: string; orderNumber?: string; paymentReferenceToken?: string; guestOrder?: boolean }>("/api/v1/customer/orders", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(payload) }),
  receipt: (token: string, orderId: string) => request<DigitalReceipt>(`/api/v1/customer/orders/${orderId}/receipt`, { headers: { Authorization: `Bearer ${token}` } }),
  logout: (token: string) =>
    request<void>("/api/v1/customer/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
}
