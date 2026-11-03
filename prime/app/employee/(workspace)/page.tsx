import Link from "next/link"
import { ArrowRight, Clock3, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import {
  getCurrentPayEstimate,
  getEmployeeData,
  getEmployeePayrollRecords,
} from "./data"

const money = (value: number) =>
  `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function EmployeeDashboardPage() {
  const { staff, employee, source } = await getEmployeeData()
  const [estimate, today, records] = await Promise.all([
    getCurrentPayEstimate(employee, source),
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    getEmployeePayrollRecords(source, employee.id),
  ])
  const todaysLogs = await source.getRepository(AttendanceLog).find({
    where: { employeeId: employee.id, logDate: today },
    order: { createdAt: "ASC" },
  })
  const todayHours = todaysLogs.reduce(
    (sum, log) => sum + Number(log.totalHours ?? 0),
    0
  )
  const latestPayslip = records[0]

  return (
    <main className="space-y-4">
      <header>
        <p className="text-sm font-medium text-primary">EMPLOYEE WORKSPACE</p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {staff.name}</h1>
        <p className="text-sm text-muted-foreground">
          Review your attendance and pay information.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Today's recorded hours" value={`${todayHours.toFixed(2)} h`} icon={Clock3} />
        <Summary label="Estimated gross this cutoff" value={money(estimate.grossPay)} icon={Wallet} />
        <Summary label="Latest payslip gross" value={latestPayslip ? money(Number(latestPayslip.grossPay)) : "—"} icon={Wallet} />
      </div>

      <Card size="sm" className="[--card-spacing:--spacing(0)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold">Current pay period estimate</h2>
            <p className="text-sm text-muted-foreground">
              {estimate.periodStart} to {estimate.periodEnd} · {estimate.paidHours.toFixed(2)} paid hours · {estimate.attendanceDays.toFixed(2)} duty days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimate based on recorded attendance. Final gross pay appears on the payslip after payroll is processed.
            </p>
          </div>
          <strong className="text-xl">{money(estimate.grossPay)}</strong>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink href="/employee/attendance" title="Attendance" description="Review your AM/PM clock in and clock out records." />
        <QuickLink href="/employee/payslips" title="Payslips" description="See gross pay, deductions, and net pay by cutoff." />
      </div>
    </main>
  )
}

function Summary({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock3 }) {
  return (
    <Card size="sm" className="[--card-spacing:--spacing(0)]">
      <CardContent className="flex items-center gap-3 p-3">
        <span className="grid size-9 place-items-center rounded-lg bg-muted"><Icon className="size-4" /></span>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
