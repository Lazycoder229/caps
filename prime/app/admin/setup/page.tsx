import Link from "next/link"
import { redirect } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth-split-layout"
import { Button } from "@/components/ui/button"
import { hasAdministratorAccount } from "@/lib/staff-auth/admin-bootstrap"
import { AdminSetupForm } from "./setup-form"

export const dynamic = "force-dynamic"

export default async function AdminSetupPage() {
  if (await hasAdministratorAccount()) redirect("/admin/login")
  const configured = (process.env.ADMIN_BOOTSTRAP_KEY?.length ?? 0) >= 24

  return (
    <AuthSplitLayout
      eyebrow="Admin account setup"
      title="Set up the first administrator"
      description="One-time setup. After this account is created, this page will close."
    >
      {configured ? (
        <AdminSetupForm />
      ) : (
        <div className="space-y-3 text-sm">
          <p
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
          >
            Set <code>ADMIN_BOOTSTRAP_KEY</code> in <code>.env.local</code> to a
            private secret at least 24 characters long, then restart the app.
            Enter that same key here to create the first account.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/login">Back to sign in</Link>
          </Button>
        </div>
      )}
    </AuthSplitLayout>
  )
}
