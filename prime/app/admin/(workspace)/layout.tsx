import { Suspense } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { PrimePosChatbot } from "@/components/prime-pos-chatbot"
import { PageSkeleton } from "@/components/page-skeleton"
import { Separator } from "@/components/ui/separator"
import { connection } from "next/server"
import { requireAdministrator } from "@/lib/staff-auth/session"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const dynamic = "force-dynamic"

export default function AdminWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense
      fallback={
        <PageSkeleton />
      }
    >
      <AuthorizedAdminWorkspace>{children}</AuthorizedAdminWorkspace>
    </Suspense>
  )
}

async function AuthorizedAdminWorkspace({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Admin pages show live, database-backed workspace data. Keep them out of
  // build-time prerendering so database queries run only for real requests.
  await connection()
  await requireAdministrator()

  return (
    <>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="max-w-full min-w-0 flex-1 overflow-x-clip">
          <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b bg-background/95 px-3.5 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
          </header>
          <div className="w-full max-w-full min-w-0 flex-1 p-2 sm:p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <PrimePosChatbot role="admin" />
    </>
  )
}
