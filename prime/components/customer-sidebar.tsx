"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CircleUserRound,
  CalendarDays,
  ChevronUp,
  ClipboardList,
  Gift,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Store,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { logoutCustomer } from "@/app/customer/auth-actions"

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/customer/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Orders",
    items: [
      { title: "Order kiosk", url: "/customer/kiosk", icon: ShoppingBag },
      { title: "Order history", url: "/customer/orders", icon: ClipboardList },
      { title: "Reservations", url: "/customer/reservations", icon: CalendarDays },
    ],
  },
  {
    label: "Loyalty",
    items: [{ title: "Points & rewards", url: "/customer/rewards", icon: Gift }],
  },
]

const navClass =
  "text-base py-2.5 [&_svg]:size-5 data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-600 data-[active=true]:font-medium dark:data-[active=true]:text-amber-500"

export function CustomerSidebar({ customerName, email }: { customerName: string; email: string | null }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobile = () => { if (isMobile) setOpenMobile(false) }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-start gap-2 p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Store className="size-6 shrink-0 text-amber-500" />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              PRIME POS
            </span>
            <span className="truncate text-xs text-muted-foreground">Customer</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const active = pathname === item.url || (item.url !== "/customer/dashboard" && pathname.startsWith(`${item.url}/`))
                  return <SidebarMenuItem key={item.url}><SidebarMenuButton className={navClass} isActive={active} onClick={closeMobile} asChild><Link href={item.url}><item.icon /><span>{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>
                })}
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
                  <CircleUserRound />
                  <span className="truncate">{customerName}</span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width] min-w-56">
                <DropdownMenuItem asChild>
                  <Link href="/customer/account" onClick={closeMobile}><CircleUserRound />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => { void logoutCustomer() }}>
                  <LogOut />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      
      </SidebarFooter>
    </Sidebar>
  )
}
