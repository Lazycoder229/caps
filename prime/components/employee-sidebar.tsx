"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock3, LayoutDashboard, LogOut, UserRound, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { logoutEmployee } from "@/lib/staff-auth/actions"

const items = [
  { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
  { title: "Attendance", url: "/employee/attendance", icon: Clock3 },
  { title: "Payslips", url: "/employee/payslips", icon: Wallet },
  { title: "My account", url: "/employee/account", icon: UserRound },
]

export function EmployeeSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Wallet className="size-6 shrink-0 text-amber-500" />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight">PRIME POS</span>
            <span className="text-xs text-muted-foreground">Employee portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>My workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    className="py-2.5 text-base [&_svg]:size-5 data-[active=true]:bg-amber-500/10 data-[active=true]:font-medium data-[active=true]:text-amber-600"
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/employee" &&
                        pathname.startsWith(`${item.url}/`))
                    }
                    onClick={() => isMobile && setOpenMobile(false)}
                    asChild
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-row items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground group-data-[collapsible=icon]:px-2">
        <span className="truncate group-data-[collapsible=icon]:hidden">{staffName}</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => void logoutEmployee()}
        >
          <LogOut className="size-4" />
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
