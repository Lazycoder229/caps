import { Suspense } from "react"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { PageSkeleton } from "@/components/page-skeleton"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { requireEmployeeSession } from "@/lib/staff-auth/session"

export default function EmployeeWorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <PageSkeleton />
      }
    >
      <AuthorizedEmployeeWorkspace>{children}</AuthorizedEmployeeWorkspace>
    </Suspense>
  )
}

async function AuthorizedEmployeeWorkspace({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const staff = await requireEmployeeSession()
  return (
    <SidebarProvider>
      <EmployeeSidebar staffName={staff.name} />
      <SidebarInset className="max-w-full min-w-0 flex-1 overflow-x-clip">
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b bg-background/95 px-3.5 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium text-muted-foreground">Employee workspace</span>
        </header>
        <div className="w-full max-w-full min-w-0 flex-1 p-2 sm:p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
