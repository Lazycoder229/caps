import { getEmployeeData, getEmployeePayrollRecords } from "../data"

const money = (value: number) =>
  `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+08:00`))
}

export default async function EmployeePayslipsPage() {
  const { employee, source } = await getEmployeeData()
  const records = await getEmployeePayrollRecords(source, employee.id)

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My payslips</h1>
        <p className="text-sm text-muted-foreground">Payroll records and pay breakdowns for your account.</p>
      </header>
      {records.length ? (
        <div className="space-y-3">
          {records.map((record) => {
            const period = record.payrollPeriod
            const deductions = record.deductions ?? []
            return (
              <article key={record.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">Cutoff {dateLabel(String(period.periodStart))} – {dateLabel(String(period.periodEnd))}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${period.status === "closed" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"}`}>
                        {period.status === "closed" ? "Final" : "In progress"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Number(record.attendanceDays).toFixed(2)} duty days · {Number(record.paidHours).toFixed(2)} paid hours · Processed {dateLabel(String(record.processedAt))}
                    </p>
                  </div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Gross pay</p><p className="text-lg font-semibold">{money(Number(record.grossPay))}</p></div>
                </div>
                <div className="mt-4 grid gap-2 border-t pt-3 sm:grid-cols-3">
                  <Amount label="Gross pay" value={Number(record.grossPay)} />
                  <Amount label="Employee deductions" value={Number(record.totalDeductions)} />
                  <Amount label="Net pay" value={Number(record.netPay)} emphasis />
                </div>
                {deductions.length ? (
                  <details className="mt-3 border-t pt-3">
                    <summary className="cursor-pointer text-sm font-medium">View deduction breakdown</summary>
                    <div className="mt-2 divide-y rounded-lg border px-3">
                      {deductions.map((deduction) => (
                        <div key={deduction.id} className="flex justify-between gap-3 py-2 text-sm">
                          <span>{deduction.deductionName ?? deduction.deductionTypeId}</span>
                          <span className="font-medium">{money(Number(deduction.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">No payslips yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your payroll records will appear here after payroll is processed.</p>
        </div>
      )}
    </main>
  )
}

function Amount({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 sm:block"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-sm ${emphasis ? "font-bold" : "font-medium"}`}>{money(value)}</p></div>
}
