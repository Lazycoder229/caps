import type { Employee } from "@/lib/database/entities/entities/Employee"
import type { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import {
  defaultPayrollCalculationSettings,
  type PayrollCalculationSettings,
} from "./settings"

export const DUTY_HOURS_PER_DAY =
  defaultPayrollCalculationSettings.payrollDutyHours
export const BREAK_HOURS_PER_DAY =
  defaultPayrollCalculationSettings.payrollUnpaidBreakHours
export const SHIFT_HOURS_PER_DAY = DUTY_HOURS_PER_DAY + BREAK_HOURS_PER_DAY
export const STANDARD_WORKDAYS_PER_MONTH =
  defaultPayrollCalculationSettings.payrollWorkdaysPerMonth

export type PayrollAmounts = {
  grossPay: number
  dailyRate: number
  paidHours: number
  overtimeHours: number
  attendanceDays: number
  deductions: Array<{
    code: "SSS" | "PHILHEALTH" | "PAGIBIG" | "MEALS"
    name: string
    amount: number
    employerAmount: number
    notes: string | null
  }>
  totalDeductions: number
  netPay: number
}

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

/** A full shift is the configured duty hours plus its unpaid break. */
export function paidHoursFromAttendance(
  log: AttendanceLog,
  settings: PayrollCalculationSettings = defaultPayrollCalculationSettings
): number {
  if (
    log.status === "absent" ||
    log.status === "incomplete" ||
    log.totalHours == null
  )
    return 0
  const duration = Math.max(0, Number(log.totalHours))
  return Math.min(
    settings.payrollDutyHours,
    Math.max(
      0,
      duration -
        (duration >=
        settings.payrollDutyHours + settings.payrollUnpaidBreakHours
          ? settings.payrollUnpaidBreakHours
          : 0)
    )
  )
}

export function calculatePayroll(
  employee: Employee,
  logs: AttendanceLog[],
  settings: PayrollCalculationSettings = defaultPayrollCalculationSettings
): PayrollAmounts {
  const logsByDay = new Map<string, AttendanceLog[]>()
  for (const log of logs) {
    const dayLogs = logsByDay.get(String(log.logDate)) ?? []
    dayLogs.push(log)
    logsByDay.set(String(log.logDate), dayLogs)
  }
  let paidHours = 0
  let overtimeHours = 0
  for (const dayLogs of logsByDay.values()) {
    const completed = dayLogs.filter(
      (log) =>
        log.status !== "absent" &&
        log.status !== "incomplete" &&
        log.totalHours != null
    )
    if (completed.length > 1) {
      // Separate in/out pairs exclude the break between them, so sum both
      // intervals and cap regular pay at the configured daily duty hours.
      const totalHours = completed.reduce(
        (sum, log) => sum + Math.max(0, Number(log.totalHours ?? 0)),
        0
      )
      paidHours += Math.min(settings.payrollDutyHours, totalHours)
      overtimeHours += Math.max(0, totalHours - settings.payrollDutyHours)
      continue
    }
    const [log] = completed
    if (!log) continue
    paidHours += paidHoursFromAttendance(log, settings)
    const duration = Math.max(0, Number(log.totalHours ?? 0))
    const overtimeStart =
      settings.payrollDutyHours + settings.payrollUnpaidBreakHours
    overtimeHours += Math.max(0, duration - overtimeStart)
  }
  const attendanceDays = paidHours / settings.payrollDutyHours
  const dailyRate =
    employee.salaryType === "daily"
      ? Number(employee.basicSalary)
      : Number(employee.basicSalary) / settings.payrollWorkdaysPerMonth
  const hourlyRate = dailyRate / settings.payrollDutyHours
  const regularPay = paidHours * hourlyRate
  const grossPay = money(
    regularPay + overtimeHours * hourlyRate * settings.payrollOvertimeMultiplier
  )
  const contributions = [
    {
      code: "SSS" as const,
      name: "SSS employee share",
      amount: money(settings.payrollSssEmployeeShare),
      employerAmount: money(settings.payrollSssEmployerShare),
      notes: "Global amount from System Settings; per cutoff.",
    },
    {
      code: "PHILHEALTH" as const,
      name: "PhilHealth employee share",
      amount: money(settings.payrollPhilhealthEmployeeShare),
      employerAmount: money(settings.payrollPhilhealthEmployerShare),
      notes: "Global amount from System Settings; per cutoff.",
    },
    {
      code: "PAGIBIG" as const,
      name: "Pag-IBIG employee share",
      amount: money(settings.payrollPagibigEmployeeShare),
      employerAmount: money(settings.payrollPagibigEmployerShare),
      notes: "Global amount from System Settings; per cutoff.",
    },
    {
      code: "MEALS" as const,
      name: "Meals deduction",
      amount: money(settings.payrollMealsDeduction),
      employerAmount: 0,
      notes: "Global amount from System Settings; per cutoff.",
    },
  ]
  const totalDeductions = money(
    contributions.reduce((total, item) => total + item.amount, 0)
  )
  return {
    grossPay,
    dailyRate: money(dailyRate),
    paidHours: money(paidHours),
    overtimeHours: money(overtimeHours),
    attendanceDays: money(attendanceDays),
    deductions: contributions,
    totalDeductions,
    netPay: money(Math.max(0, grossPay - totalDeductions)),
  }
}
