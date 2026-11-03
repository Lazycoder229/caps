// components/admin-sidebar.tsx
"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Rss,
  CalendarCheck,
  Tag,
  Printer,
  FileX,
  ShieldCheck,
  ChartNoAxesCombined,
  Users,
  Clock3,
  Wallet,
  Settings,
  ChevronUp,
  LogOutIcon,
  UserIcon,
  QrCode,
  ShelvingUnit,
  Gift,
  BrainCircuit,
} from "lucide-react"
import { logoutAdmin } from "@/lib/staff-auth/actions"

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Live Orders", url: "/admin/orders", icon: Rss },
      { title: "QR / Table Setup", url: "/admin/tables", icon: QrCode },
      {
        title: "Reservations",
        url: "/admin/reservations",
        icon: CalendarCheck,
      },
      { title: "Discounts & Promos", url: "/admin/discounts", icon: Tag },
      { title: "Printer Settings", url: "/admin/printer", icon: Printer },
      { title: "Void/Cancellation Logs", url: "/admin/voids", icon: FileX },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Roles & Access", url: "/admin/rbac", icon: ShieldCheck },
      { title: "Employee Management", url: "/admin/employees", icon: Users },
      { title: "Attendance", url: "/admin/attendance", icon: Clock3 },
      { title: "Payroll", url: "/admin/payroll", icon: Wallet },
      { title: "Customer Management", url: "/admin/loyalty", icon: Gift },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Sales & Reports", url: "/admin/sales", icon: ChartNoAxesCombined },
      { title: "Model Training", url: "/admin/training", icon: BrainCircuit },
    ],
  },
  {
    label: "System",
    items: [
      /*  { title: "Branch Management", url: "/admin/branches", icon: Boxes }, */
      {
        title: "Inventory Management",
        url: "/admin/inventory",
        icon: ShelvingUnit,
      },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
]

// Base styling + emerald accent for the active nav item (matches the

const menuButtonClass =
  "text-base py-2.5 [&_svg]:size-5 " +
  "data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-600 " +
  "data-[active=true]:font-medium dark:data-[active=true]:text-amber-500 " +
  "data-[active=true]:[&_svg]:text-amber-600 dark:data-[active=true]:[&_svg]:text-amber-500"

export function AdminSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <ShieldCheck className="size-6 shrink-0 text-amber-500" />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              PRIME POS
            </span>
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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      isActive={pathname === item.url}
                      onClick={handleNavClick}
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-amber-500/10 data-[state=open]:text-amber-600 dark:data-[state=open]:text-amber-400">
                  <UserIcon />
                  <span>{/* profile?.name ?? */ "Admin"}</span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-popper-anchor-width] min-w-56"
              >
                <DropdownMenuItem>
                  <UserIcon />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    event.preventDefault()
                    void logoutAdmin()
                  }}
                >
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
