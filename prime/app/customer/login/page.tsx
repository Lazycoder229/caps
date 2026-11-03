import { AuthSplitLayout } from "@/components/auth-split-layout"
import { CustomerQrScanButton } from "@/components/customer-qr-scan-button"
import { getCustomerSession } from "@/lib/customer-auth/session"
import { redirect } from "next/navigation"
import { CustomerLoginForm } from "../auth-forms"

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string | string[] }>
}) {
  const [query, customer] = await Promise.all([
    searchParams ?? Promise.resolve({ returnTo: undefined }),
    getCustomerSession(),
  ])
  if (customer) redirect("/customer/dashboard")
  const returnTo = Array.isArray(query.returnTo)
    ? (query.returnTo[0] ?? "")
    : (query.returnTo ?? "")
  return (
    <AuthSplitLayout
      eyebrow="Customer sign in"
      welcomeMessage="Welcome to PRIME!"
      title="Sign in to your account"
      description="Order your favorites, track your receipts, and manage your rewards."
    >
      <div className="mb-5 rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Dining in?</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Scan your table QR to browse and place a guest order. Sign in to save your order history and points.
        </p>
        <CustomerQrScanButton />
      </div>
      <CustomerLoginForm returnTo={returnTo} />
    </AuthSplitLayout>
  )
}
