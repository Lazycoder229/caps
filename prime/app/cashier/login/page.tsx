import { redirect } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth-split-layout"
import { StaffLoginForm } from "@/components/staff-login-form"
import { loginCashier } from "@/lib/staff-auth/actions"
import { getStaffSession } from "@/lib/staff-auth/session"

export default async function CashierLoginPage() {
  const staff = await getStaffSession()
  if (staff?.permissionCodes.includes("orders:view")) redirect("/cashier")

  return (
    <AuthSplitLayout
      eyebrow="Cashier sign in"
      welcomeMessage="Welcome to PRIME!"
      title="Sign in to your cashier account"
      description="Access live orders and checkout tools from your PRIME POS workspace."
    >
      <StaffLoginForm action={loginCashier} portal="Cashier" />
    </AuthSplitLayout>
  )
}
