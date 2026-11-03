import { CustomerSidebar } from "@/components/customer-sidebar"
import { PrimePosChatbot } from "@/components/prime-pos-chatbot"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function CustomerWorkspaceShell({
  customerName,
  email,
  children,
}: Readonly<{
  customerName: string
  email: string | null
  children: React.ReactNode
}>) {
  return (
    <>
      <SidebarProvider>
        <CustomerSidebar customerName={customerName} email={email} />
        <SidebarInset className="max-w-full min-w-0 flex-1 overflow-x-clip">
          <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b bg-background/95 px-3.5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] backdrop-blur-sm sm:px-4 sm:py-3 print:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
          </header>
          <div className="w-full max-w-full min-w-0 flex-1 p-2 sm:p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <PrimePosChatbot role="customer" />
    </>
  )
}
