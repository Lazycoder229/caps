import "server-only"

import { getInitializedDataSource } from "@/lib/database/data-source"
import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { PayrollRecord } from "@/lib/database/entities/entities/PayrollRecord"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { requireEmployeeSession } from "@/lib/staff-auth/session"
import { calculatePayroll } from "@/lib/payroll/calculation"
import { readPayrollCalculationSettings } from "@/lib/payroll/settings"

export async function getEmployeeData() {
  const staff = await requireEmployeeSession()
  const source = await getInitializedDataSource()
  const employee = await source.getRepository(Employee).findOne({
    where: { id: staff.employeeId },
    relations: { user: true },
  })
  if (!employee) throw new Error("Employee record is unavailable.")
  return { staff, source, employee }
}

export async function getCurrentPayEstimate(
  employee: Employee,
  source: Awaited<ReturnType<typeof getInitializedDataSource>>
) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const day = Number(today.slice(-2))
  const periodStart = `${today.slice(0, 7)}-${day <= 15 ? "01" : "16"}`
  const logs = await source
    .getRepository(AttendanceLog)
    .createQueryBuilder("log")
    .where("log.employeeId = :employeeId", { employeeId: employee.id })
    .andWhere("log.logDate >= :periodStart", { periodStart })
    .andWhere("log.logDate <= :today", { today })
    .getMany()
  const storedSettings = await source.getRepository(SystemSetting).findOne({
    where: {},
    select: {
      id: true,
      payrollDutyHours: true,
      payrollUnpaidBreakHours: true,
      payrollWorkdaysPerMonth: true,
      payrollOvertimeMultiplier: true,
      payrollSssEmployeeShare: true,
      payrollSssEmployerShare: true,
      payrollPhilhealthEmployeeShare: true,
      payrollPhilhealthEmployerShare: true,
      payrollPagibigEmployeeShare: true,
      payrollPagibigEmployerShare: true,
      payrollMealsDeduction: true,
    },
  })
  return {
    periodStart,
    periodEnd: today,
    ...calculatePayroll(
      employee,
      logs,
      readPayrollCalculationSettings(storedSettings)
    ),
  }
}

export async function getEmployeePayrollRecords(
  source: Awaited<ReturnType<typeof getInitializedDataSource>>,
  employeeId: string
) {
  return source
    .getRepository(PayrollRecord)
    .createQueryBuilder("record")
    .leftJoinAndSelect("record.payrollPeriod", "period")
    .leftJoinAndSelect("record.deductions", "deduction")
    .where("record.employeeId = :employeeId", { employeeId })
    .orderBy("period.periodStart", "DESC")
    .addOrderBy("record.processedAt", "DESC")
    .getMany()
}
