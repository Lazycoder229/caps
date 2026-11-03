"use client"

import { useState } from "react"
import { Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAttendance } from "./hooks/use-attendance"
import type { AttendanceRow } from "./types"

export function AttendanceWorkspace({ rows }: { rows: AttendanceRow[] }) {
  const [uid, setUid] = useState("")
  const { pending, tap } = useAttendance()
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Record four RFID taps per day: clock in and out for the first work
          interval, take a one-hour break, then clock in and out again. Payroll
          adds the two work intervals and excludes the break.
        </p>
      </header>
      <Card size="sm">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
              RFID card UID
              <input
                autoFocus
                value={uid}
                onChange={(event) => setUid(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    tap(uid)
                    setUid("")
                  }
                }}
                placeholder="Tap or enter RFID UID"
                className="h-9 rounded-md border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <Button
              disabled={pending || !uid.trim()}
              onClick={() => {
                tap(uid)
                setUid("")
              }}
            >
              <Radio className="mr-2 size-4" />
              {pending ? "Recording…" : "Record RFID tap"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
              <tr>
                <th rowSpan={2} className="px-4 py-2.5 font-medium">
                  Employee
                </th>
                <th rowSpan={2} className="px-4 py-2.5 font-medium">
                  Date
                </th>
                <th colSpan={2} className="px-4 py-2.5 text-center font-medium">
                  AM
                </th>
                <th colSpan={2} className="px-4 py-2.5 text-center font-medium">
                  PM
                </th>
                <th rowSpan={2} className="px-4 py-2.5 font-medium">
                  Total hours
                </th>
                <th rowSpan={2} className="px-4 py-2.5 font-medium">
                  Status
                </th>
              </tr>
              <tr className="border-t border-border/60">
                {["Clock in", "Clock out", "Clock in", "Clock out"].map(
                  (label, index) => (
                    <th
                      key={`${label}-${index}`}
                      className="px-4 py-2 font-medium"
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employeeNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.logDate}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatTime(row.amClockIn)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatTime(row.amClockOut)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatTime(row.pmClockIn)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatTime(row.pmClockOut)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.totalHours == null
                      ? "—"
                      : `${row.totalHours.toFixed(2)} h`}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {row.status.replaceAll("_", " ")}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-5 text-center text-muted-foreground"
                  >
                    No attendance scans recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}

function formatTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "—"
}
