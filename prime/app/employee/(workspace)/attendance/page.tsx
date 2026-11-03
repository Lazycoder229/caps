import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import { getCurrentPayEstimate, getEmployeeData } from "../data"

function time(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      }).format(value)
    : "—"
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+08:00`))
}

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function EmployeeAttendancePage() {
  const { employee, source } = await getEmployeeData()
  const [logs, estimate] = await Promise.all([
    source.getRepository(AttendanceLog).find({
      where: { employeeId: employee.id },
      order: { logDate: "DESC", clockIn: "DESC" },
      take: 500,
    }),
    getCurrentPayEstimate(employee, source),
  ])
  const grouped = new Map<string, AttendanceLog[]>()
  for (const log of logs) {
    const key = String(log.logDate).slice(0, 10)
    grouped.set(key, [...(grouped.get(key) ?? []), log])
  }
  const days = [...grouped.entries()].map(([date, rows]) => {
    const am: AttendanceLog[] = []
    const pm: AttendanceLog[] = []
    const ordered = rows.slice().sort(
      (a, b) => (a.clockIn?.getTime() ?? 0) - (b.clockIn?.getTime() ?? 0)
    )
    for (const [index, row] of ordered.entries()) {
      const hour = row.clockIn
        ? Number(new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hourCycle: "h23",
            timeZone: "Asia/Manila",
          }).format(row.clockIn))
        : 12
      if (hour < 12) am.push(row)
      else pm.push(row)
      if (index > 0 && am.includes(row) && pm.length === 0) {
        am.pop()
        pm.push(row)
      }
    }
    const firstTime = (entries: AttendanceLog[], field: "clockIn" | "clockOut") => {
      const values = entries.map((entry) => entry[field]).filter((value): value is Date => value !== null)
      if (!values.length) return null
      return values.reduce((best, value) =>
        field === "clockIn"
          ? best.getTime() <= value.getTime() ? best : value
          : best.getTime() >= value.getTime() ? best : value
      )
    }
    const status = rows.some((row) => !row.clockOut || row.status === "incomplete")
      ? "Incomplete"
      : rows.some((row) => row.status === "overtime")
        ? "Overtime"
        : rows.some((row) => row.status === "late")
          ? "Late"
          : rows.every((row) => row.status === "absent")
            ? "Absent"
            : "On time"
    return {
      date,
      amIn: firstTime(am, "clockIn"),
      amOut: firstTime(am, "clockOut"),
      pmIn: firstTime(pm, "clockIn"),
      pmOut: firstTime(pm, "clockOut"),
      hours: rows.reduce((sum, row) => sum + Number(row.totalHours ?? 0), 0),
      status,
    }
  })

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My attendance</h1>
        <p className="text-sm text-muted-foreground">Review your recorded AM and PM punches and hours.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Current cutoff" value={`${estimate.periodStart} – ${estimate.periodEnd}`} />
        <Summary label="Paid hours this cutoff" value={`${estimate.paidHours.toFixed(2)} h`} />
        <Summary label="Estimated gross this cutoff" value={money(estimate.grossPay)} />
      </div>
      {days.length ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">AM clock in</th>
                  <th className="px-4 py-3 font-medium">AM clock out</th>
                  <th className="px-4 py-3 font-medium">PM clock in</th>
                  <th className="px-4 py-3 font-medium">PM clock out</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{dateLabel(day.date)}</td>
                    <td className="px-4 py-3">{time(day.amIn)}</td>
                    <td className="px-4 py-3">{time(day.amOut)}</td>
                    <td className="px-4 py-3">{time(day.pmIn)}</td>
                    <td className="px-4 py-3">{time(day.pmOut)}</td>
                    <td className="px-4 py-3">{day.hours.toFixed(2)} h</td>
                    <td className="px-4 py-3"><Status value={day.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 md:hidden">
            {days.map((day) => (
              <article key={day.date} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{dateLabel(day.date)}</h2>
                  <Status value={day.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Punch label="AM in" value={time(day.amIn)} />
                  <Punch label="AM out" value={time(day.amOut)} />
                  <Punch label="PM in" value={time(day.pmIn)} />
                  <Punch label="PM out" value={time(day.pmOut)} />
                </div>
                <p className="mt-3 border-t pt-2 text-sm"><span className="text-muted-foreground">Recorded hours</span><strong className="float-right">{day.hours.toFixed(2)} h</strong></p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No attendance records are available yet.
        </div>
      )}
    </main>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>
}

function Punch({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/50 px-2.5 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>
}

function Status({ value }: { value: string }) {
  return <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{value}</span>
}
