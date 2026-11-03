import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowUpRight,
  CircleUserRound,
  Gift,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requireCustomerSession } from "@/lib/customer-auth/session"
import { CustomerProfileForm } from "./profile-form"

export default async function CustomerAccountPage() {
  const customer = await requireCustomerSession()
  const initials = customer.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <main className="grid w-full gap-4">
      <header>
        <p className="text-sm text-muted-foreground">Customer account</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account & profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal details and membership information.
        </p>
      </header>

      <Card size="sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-500/10 text-base font-semibold text-amber-700"
            >
              {initials || <CircleUserRound className="size-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{customer.name}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {customer.email}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since{" "}
                {new Intl.DateTimeFormat("en-PH", {
                  dateStyle: "medium",
                  timeZone: "Asia/Manila",
                }).format(customer.createdAt)}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/customer/rewards">
              <Gift className="size-4" />
              {new Intl.NumberFormat("en-PH").format(
                customer.loyaltyPointsBalance
              )}{" "}
              points
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <Card size="sm">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="font-semibold">Personal information</h2>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Keep your contact information current for order updates.
              </p>
            </div>
            <CustomerProfileForm
              name={customer.name}
              contactNumber={customer.contactNumber ?? ""}
            />
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <InfoCard
            icon={<Mail className="size-4" />}
            title="Sign-in email"
          >
            <p className="break-all text-sm text-muted-foreground">
              {customer.email}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your email is used to sign in. To change it or reset your
              password, contact the restaurant team.
            </p>
          </InfoCard>
          <InfoCard
            icon={<ShieldCheck className="size-4" />}
            title="Account security"
          >
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Your account is protected with a password and a secure sign-in
              session.
            </p>
          </InfoCard>
          <Card size="sm">
            <CardContent className="p-4">
              <h2 className="font-semibold">Need help?</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                For account access or profile questions, contact the restaurant.
              </p>
              <p className="mt-2 text-sm font-medium">
                {customer.contactNumber || "Add a mobile number to your profile"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold">{title}</h2>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
