"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CalendarCheck,
  ChartNoAxesCombined,
  FileX,
  LayoutDashboard,
  LogOut,
  Rss,
  Utensils,
} from "lucide-react"
import { logoutCashier } from "@/lib/staff-auth/actions"
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

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/cashier", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Live Orders", url: "/cashier/orders", icon: Rss },
      {
        title: "Reservations",
        url: "/cashier/reservations",
        icon: CalendarCheck,
      },
      { title: "Menu Management", url: "/cashier/menu", icon: Utensils },
      { title: "Void & Cancellations", url: "/cashier/voids", icon: FileX },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Sales & Reports",
        url: "/cashier/reports",
        icon: BarChart3,
      },
    ],
  },
]

const activeClass =
  "text-base py-2.5 [&_svg]:size-5 data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-600 data-[active=true]:font-medium dark:data-[active=true]:text-amber-500"

export function CashierSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Utensils className="size-6 shrink-0 text-amber-500" />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              PRIME POS
            </span>
            <span className="text-xs text-muted-foreground">Cashier</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      className={activeClass}
                      isActive={
                        pathname === item.url ||
                        (item.url !== "/cashier" &&
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
        ))}
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 text-xs text-muted-foreground group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {staffName}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void logoutCashier()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
