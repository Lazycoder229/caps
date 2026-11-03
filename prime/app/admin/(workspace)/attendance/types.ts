export type AttendanceRow = {
  id: string
  employeeName: string
  employeeNumber: string
  logDate: string
  amClockIn: string | null
  amClockOut: string | null
  pmClockIn: string | null
  pmClockOut: string | null
  totalHours: number | null
  status: string
}
