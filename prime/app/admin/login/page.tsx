import { redirect } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth-split-layout"
import { StaffLoginForm } from "@/components/staff-login-form"
import { loginAdmin } from "@/lib/staff-auth/actions"
import { hasAdministratorAccount } from "@/lib/staff-auth/admin-bootstrap"
import { getStaffSession } from "@/lib/staff-auth/session"

export default async function AdminLoginPage() {
  let staff: Awaited<ReturnType<typeof getStaffSession>> = null
  try {
    staff = await getStaffSession()
  } catch (error) {
    console.error("Unable to check the admin login session:", error)
  }
  if (
    staff &&
    /^(admin|administrator)$/i.test(staff.roleName.trim()) &&
    staff.permissionCodes.includes("employees:manage")
  )
    redirect("/admin")
  let administratorExists: boolean | null = null
  try {
    administratorExists = await hasAdministratorAccount()
  } catch (error) {
    console.error("Unable to check for an administrator account:", error)
  }

  return (
    <AuthSplitLayout
      eyebrow="Admin sign in"
      welcomeMessage="Welcome to PRIME!"
      title="Sign in to your admin account"
      description="Manage restaurant operations from your PRIME POS workspace."
    >
      <StaffLoginForm action={loginAdmin} portal="Admin" />
      {administratorExists === false ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          First time setup?{" "}
          <a
            className="font-medium text-foreground underline underline-offset-4"
            href="/admin/setup"
          >
            Create the first administrator
          </a>
        </p>
      ) : null}
    </AuthSplitLayout>
  )
}
