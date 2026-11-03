import { getInitializedDataSource } from "@/lib/database/data-source"
import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import { AttendanceWorkspace } from "./workspace"
import type { AttendanceRow } from "./types"

export default async function AttendancePage() {
  try {
    const logs = await (
      await getInitializedDataSource()
    )
      .getRepository(AttendanceLog)
      .find({
        relations: { employee: { user: true } },
        order: { logDate: "DESC", createdAt: "DESC" },
        take: 100,
      })
    const byDay = new Map<string, typeof logs>()
    for (const log of logs) {
      const day = String(log.logDate).slice(0, 10)
      const key = `${log.employeeId}:${day}`
      const entries = byDay.get(key) ?? []
      entries.push(log)
      byDay.set(key, entries)
    }
    const rows: AttendanceRow[] = [...byDay.entries()].map(([key, entries]) => {
      const morning: typeof logs = []
      const afternoon: typeof logs = []
      const ordered = entries
        .slice()
        .sort(
          (a, b) => (a.clockIn?.getTime() ?? 0) - (b.clockIn?.getTime() ?? 0)
        )
      for (const [index, log] of ordered.entries()) {
        const hour = log.clockIn
          ? Number(
              new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                hourCycle: "h23",
                timeZone: "Asia/Manila",
              }).format(log.clockIn)
            )
          : 12
        if (hour < 12) morning.push(log)
        else afternoon.push(log)
        // If both intervals happened before noon, keep the second one visible
        // in the PM columns instead of hiding a recorded attendance pair.
        if (index > 0 && morning.includes(log) && afternoon.length === 0) {
          morning.pop()
          afternoon.push(log)
        }
      }
      const first = entries[0]
      const firstTime = (items: typeof logs, field: "clockIn" | "clockOut") => {
        const values = items
          .map((item) => item[field])
          .filter((value): value is Date => value !== null)
        if (!values.length) return null
        const time = values.reduce((a, b) =>
          field === "clockIn"
            ? a.getTime() <= b.getTime()
              ? a
              : b
            : a.getTime() >= b.getTime()
              ? a
              : b
        )
        return time.toISOString()
      }
      const hasOpenInterval = entries.some((entry) => !entry.clockOut)
      const status = hasOpenInterval
        ? "incomplete"
        : entries.some((entry) => entry.status === "overtime")
          ? "overtime"
          : entries.some((entry) => entry.status === "late")
            ? "late"
            : "on_time"
      const recordedHours = entries.some((entry) => entry.totalHours != null)
        ? entries.reduce(
            (sum, entry) =>
              sum + (entry.totalHours == null ? 0 : Number(entry.totalHours)),
            0
          )
        : null
      return {
        id: key,
        employeeName: first.employee.user.name,
        employeeNumber: first.employee.employeeNumber,
        logDate: String(first.logDate).slice(0, 10),
        amClockIn: firstTime(morning, "clockIn"),
        amClockOut: firstTime(morning, "clockOut"),
        pmClockIn: firstTime(afternoon, "clockIn"),
        pmClockOut: firstTime(afternoon, "clockOut"),
        totalHours: recordedHours,
        status,
      }
    })
    return <AttendanceWorkspace rows={rows} />
  } catch (error) {
    console.error("Unable to load attendance:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Attendance could not load. Check the database connection and apply the
          migrations.
        </p>
      </main>
    )
  }
}
