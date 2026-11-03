import { getInitializedDataSource } from "@/lib/database/data-source"
import { PayrollPeriod } from "@/lib/database/entities/entities/PayrollPeriod"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { readPayrollCalculationSettings } from "@/lib/payroll/settings"
import { PayrollWorkspace } from "./workspace"
import type { PayrollPeriodRow, PayrollRecordRow } from "./types"

export default async function PayrollPage() {
  try {
    const source = await getInitializedDataSource()
    const [periods, storedSettings] = await Promise.all([
      source.getRepository(PayrollPeriod).find({
        relations: {
          records: { employee: { user: true }, deductions: true },
        },
        order: { periodStart: "DESC" },
      }),
      source.getRepository(SystemSetting).findOne({
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
      }),
    ])
    const calculationSettings = readPayrollCalculationSettings(storedSettings)
    const rows: PayrollPeriodRow[] = periods.map((period) => ({
      id: period.id,
      periodStart: String(period.periodStart).slice(0, 10),
      periodEnd: String(period.periodEnd).slice(0, 10),
      status: period.status,
      records: period.records.map((record): PayrollRecordRow => ({
        id: record.id,
        employeeName: record.employee.user.name,
        employeeNumber: record.employee.employeeNumber,
        position: record.employee.position,
        dailyRate:
          Number(record.dailyRate) ||
          (record.employee.salaryType === "daily"
            ? Number(record.employee.basicSalary)
            : Number(record.employee.basicSalary) /
              calculationSettings.payrollWorkdaysPerMonth),
        paidHours: Number(record.paidHours),
        overtimeHours: Number(record.overtimeHours),
        attendanceDays: Number(record.attendanceDays),
        grossPay: Number(record.grossPay),
        totalDeductions: Number(record.totalDeductions),
        netPay: Number(record.netPay),
        deductions: record.deductions.map((deduction) => ({
          name: deduction.deductionName ?? deduction.deductionTypeId,
          amount: Number(deduction.amount),
          employerAmount: Number(deduction.employerAmount),
          notes: deduction.notes,
        })),
      })),
    }))
    return (
      <PayrollWorkspace
        periods={rows}
        calculationSettings={calculationSettings}
      />
    )
  } catch (error) {
    console.error("Unable to load payroll:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Payroll could not load. Check the database connection and apply the
          migrations.
        </p>
      </main>
    )
  }
}
