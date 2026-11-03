import { redirect } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth-split-layout"
import { StaffLoginForm } from "@/components/staff-login-form"
import { loginEmployee } from "@/lib/staff-auth/actions"
import { getStaffSession } from "@/lib/staff-auth/session"

export default async function EmployeeLoginPage() {
  const staff = await getStaffSession()
  if (staff) {
    if (/^(admin|administrator)$/i.test(staff.roleName.trim()))
      redirect("/admin")
    if (staff.permissionCodes.includes("orders:view")) redirect("/cashier")
    redirect("/employee")
  }

  return (
    <AuthSplitLayout
      eyebrow="Employee sign in"
      welcomeMessage="Welcome to PRIME!"
      title="Sign in to your employee account"
      description="View your attendance records, gross pay, and payslips. Your account is created by your administrator."
    >
      <StaffLoginForm action={loginEmployee} portal="Employee" />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Need an account? Ask your administrator to create one.
      </p>
    </AuthSplitLayout>
  )
}
