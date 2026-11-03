import { getCustomerSession } from "@/lib/customer-auth/session"
import { PrimePosChatbot } from "@/components/prime-pos-chatbot"
import { CustomerWorkspaceShell } from "@/components/customer-workspace-shell"

export default async function CustomerPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const customer = await getCustomerSession()
  // Scanned table QR codes open the menu without requiring an account first.
  // Other portal pages enforce authentication in their own server components.
  if (!customer) {
    return (
      <>
        <div className="min-h-svh bg-muted/20">
          <div className="mx-auto max-w-7xl px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-6">
            {children}
          </div>
        </div>
        <PrimePosChatbot role="customer" />
      </>
    )
  }
  return (
    <CustomerWorkspaceShell customerName={customer.name} email={customer.email}>
      {children}
    </CustomerWorkspaceShell>
  )
}
