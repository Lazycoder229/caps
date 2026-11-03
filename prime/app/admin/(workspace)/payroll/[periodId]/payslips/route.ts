import { getInitializedDataSource } from "@/lib/database/data-source"
import { PayrollPeriod } from "@/lib/database/entities/entities/PayrollPeriod"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { createPayslipsPdf } from "@/lib/payroll/payslip-pdf"
import { readPayrollCalculationSettings } from "@/lib/payroll/settings"
import { payrollPeriodIdSchema } from "@/lib/validations/payroll"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ periodId: string }> }
) {
  const { periodId } = await params
  const parsed = payrollPeriodIdSchema.safeParse(periodId)
  if (!parsed.success)
    return Response.json(
      { message: "Invalid payroll period." },
      { status: 400 }
    )

  try {
    const source = await getInitializedDataSource()
    const [period, storedSettings] = await Promise.all([
      source.getRepository(PayrollPeriod).findOne({
        where: { id: parsed.data },
        relations: {
          records: {
            employee: { user: true },
            deductions: true,
          },
        },
      }),
      source.getRepository(SystemSetting).findOne({
        where: {},
        select: {
          id: true,
          restaurantName: true,
          branchName: true,
          payrollWorkdaysPerMonth: true,
        },
      }),
    ])
    if (!period)
      return Response.json(
        { message: "Payroll period not found." },
        { status: 404 }
      )
    if (!period.records.length)
      return Response.json(
        { message: "There are no payroll records to download." },
        { status: 404 }
      )

    const calculationSettings = readPayrollCalculationSettings(storedSettings)
    const document = createPayslipsPdf(
      period.records.map((record) => ({
        restaurantName: storedSettings?.restaurantName ?? "Restaurant",
        branchName: storedSettings?.branchName ?? "",
        periodStart: String(period.periodStart).slice(0, 10),
        periodEnd: String(period.periodEnd).slice(0, 10),
        employeeName: record.employee.user.name,
        employeeNumber: record.employee.employeeNumber,
        position: record.employee.position,
        dailyRate:
          Number(record.dailyRate) ||
          (record.employee.salaryType === "daily"
            ? Number(record.employee.basicSalary)
            : Number(record.employee.basicSalary) /
              calculationSettings.payrollWorkdaysPerMonth),
        attendanceDays: Number(record.attendanceDays),
        paidHours: Number(record.paidHours),
        overtimeHours: Number(record.overtimeHours),
        grossPay: Number(record.grossPay),
        totalDeductions: Number(record.totalDeductions),
        netPay: Number(record.netPay),
        deductions: record.deductions.map((deduction) => ({
          name: deduction.deductionName ?? "Deduction",
          amount: Number(deduction.amount),
          employerAmount: Number(deduction.employerAmount),
        })),
      }))
    )

    const filename = `payslips-${String(period.periodStart).slice(0, 10)}-${String(period.periodEnd).slice(0, 10)}.pdf`
    const body = new ArrayBuffer(document.byteLength)
    new Uint8Array(body).set(document)
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Unable to create payroll payslips:", error)
    return Response.json(
      {
        message: "Could not create payslips. Check the database and try again.",
      },
      { status: 500 }
    )
  }
}
