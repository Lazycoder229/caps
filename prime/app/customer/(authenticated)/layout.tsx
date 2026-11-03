import { Suspense } from "react"
import { CustomerWorkspaceShell } from "@/components/customer-workspace-shell"
import { PageSkeleton } from "@/components/page-skeleton"
import { requireCustomerSession } from "@/lib/customer-auth/session"

export default function AuthenticatedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <PageSkeleton />
      }
    >
      <AuthorizedCustomerWorkspace>{children}</AuthorizedCustomerWorkspace>
    </Suspense>
  )
}

async function AuthorizedCustomerWorkspace({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const customer = await requireCustomerSession()

  return (
    <CustomerWorkspaceShell customerName={customer.name} email={customer.email}>
      {children}
    </CustomerWorkspaceShell>
  )
}
