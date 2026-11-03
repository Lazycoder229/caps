"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { Not } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import { DeductionType } from "@/lib/database/entities/entities/DeductionType"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { PayrollDeduction } from "@/lib/database/entities/entities/PayrollDeduction"
import { PayrollPeriod } from "@/lib/database/entities/entities/PayrollPeriod"
import { PayrollRecord } from "@/lib/database/entities/entities/PayrollRecord"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { calculatePayroll } from "@/lib/payroll/calculation"
import { readPayrollCalculationSettings } from "@/lib/payroll/settings"
import {
  payrollGenerationSchema,
  payrollPeriodIdSchema,
} from "@/lib/validations/payroll"

function cutoffDates(payMonth: string, payday: "5" | "20") {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(payMonth) ||
    (payday !== "5" && payday !== "20")
  )
    throw new Error("Choose a valid payroll month and payday.")
  const [year, month] = payMonth.split("-").map(Number)
  if (!year || !month || month < 1 || month > 12)
    throw new Error("Choose a valid payroll month and payday.")
  if (payday === "20") {
    return { start: `${payMonth}-01`, end: `${payMonth}-15` }
  }
  const priorMonth = new Date(Date.UTC(year, month - 2, 1))
  const priorKey = `${priorMonth.getUTCFullYear()}-${String(priorMonth.getUTCMonth() + 1).padStart(2, "0")}`
  const lastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate()
  return {
    start: `${priorKey}-16`,
    end: `${priorKey}-${String(lastDay).padStart(2, "0")}`,
  }
}

export async function closePayrollPeriod(periodId: string) {
  const parsed = payrollPeriodIdSchema.safeParse(periodId)
  if (!parsed.success) return { ok: false, message: "Invalid payroll period." }
  try {
    const periods = (await getInitializedDataSource()).getRepository(
      PayrollPeriod
    )
    const period = await periods.findOneBy({ id: parsed.data })
    if (!period) return { ok: false, message: "Payroll period not found." }
    period.status = "closed"
    await periods.save(period)
    revalidatePath("/admin/payroll")
    return {
      ok: true,
      message: "Payroll period closed. Its calculations are now locked.",
    }
  } catch (error) {
    console.error("Unable to close payroll period:", error)
    return { ok: false, message: "Could not close payroll period." }
  }
}

export async function deletePayrollPeriod(periodId: string) {
  const parsed = payrollPeriodIdSchema.safeParse(periodId)
  if (!parsed.success) return { ok: false, message: "Invalid payroll period." }
  try {
    const source = await getInitializedDataSource()
    const periods = source.getRepository(PayrollPeriod)
    const period = await periods.findOneBy({ id: parsed.data })
    if (!period) return { ok: false, message: "Payroll period not found." }
    if (period.status === "closed")
      return {
        ok: false,
        message: "Closed payroll periods are protected and cannot be deleted.",
      }
    const result = await periods.delete({
      id: parsed.data,
      status: Not("closed"),
    })
    if (!result.affected) {
      const latest = await periods.findOneBy({ id: parsed.data })
      if (latest?.status === "closed")
        return {
          ok: false,
          message:
            "Closed payroll periods are protected and cannot be deleted.",
        }
      return {
        ok: false,
        message:
          "Payroll period changed before deletion. Refresh and try again.",
      }
    }
    revalidatePath("/admin/payroll")
    return { ok: true, message: "Payroll period deleted." }
  } catch (error) {
    console.error("Unable to delete payroll period:", error)
    return {
      ok: false,
      message: "Could not delete payroll period. Check its related records.",
    }
  }
}

export async function generatePayroll(payMonth: string, payday: "5" | "20") {
  try {
    const parsed = payrollGenerationSchema.safeParse({ payMonth, payday })
    if (!parsed.success)
      return {
        ok: false,
        message:
          parsed.error.issues[0]?.message ??
          "Choose a valid payroll month and payday.",
      }
    const { start, end } = cutoffDates(parsed.data.payMonth, parsed.data.payday)
    const source = await getInitializedDataSource()
    const generated = await source.transaction(async (manager) => {
      const periodRepository = manager.getRepository(PayrollPeriod)
      const payrollSettings = readPayrollCalculationSettings(
        await manager.getRepository(SystemSetting).findOne({
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
      )
      let period = await periodRepository.findOne({
        where: { periodStart: start, periodEnd: end },
      })
      if (period?.status === "closed")
        throw new Error("This payroll period is already closed.")
      if (!period) {
        period = periodRepository.create({
          id: randomUUID(),
          periodStart: start,
          periodEnd: end,
          status: "open",
        })
        await periodRepository.save(period)
      }

      const employees = await manager
        .getRepository(Employee)
        .createQueryBuilder("employee")
        .innerJoinAndSelect("employee.user", "user")
        .where("employee.dateHired <= :end", { end })
        .andWhere(
          "(employee.dateTerminated IS NULL OR employee.dateTerminated >= :start)",
          { start }
        )
        .orderBy("employee.employeeNumber", "ASC")
        .getMany()
      if (!employees.length)
        throw new Error(
          "No payroll-eligible employees were found for this cutoff. Add staff in Employees or check their hire and termination dates."
        )
      const employeeIds = employees.map((employee) => employee.id)
      const [logs, deductionTypes] = await Promise.all([
        manager
          .getRepository(AttendanceLog)
          .createQueryBuilder("log")
          .where("log.employeeId IN (:...employeeIds)", { employeeIds })
          .andWhere("log.logDate BETWEEN :start AND :end", { start, end })
          .getMany(),
        manager
          .getRepository(DeductionType)
          .findBy([
            { code: "SSS" },
            { code: "PHILHEALTH" },
            { code: "PAGIBIG" },
            { code: "MEALS" },
          ]),
      ])
      const deductionTypeByCode = new Map(
        deductionTypes.map((item) => [item.code, item])
      )
      if (
        ["SSS", "PHILHEALTH", "PAGIBIG", "MEALS"].some(
          (code) => !deductionTypeByCode.has(code)
        )
      )
        throw new Error(
          "Apply the attendance payroll migration before generating payroll."
        )

      const recordRepo = manager.getRepository(PayrollRecord)
      const deductionRepo = manager.getRepository(PayrollDeduction)
      // Rebuild draft records on repeat runs so corrected RFID punches flow into payroll.
      await recordRepo.delete({ payrollPeriodId: period.id })
      for (const employee of employees) {
        const employeeLogs = logs.filter(
          (log) => log.employeeId === employee.id
        )
        const totals = calculatePayroll(employee, employeeLogs, payrollSettings)
        const record = recordRepo.create({
          id: randomUUID(),
          employeeId: employee.id,
          payrollPeriodId: period.id,
          grossPay: totals.grossPay,
          dailyRate: totals.dailyRate,
          totalDeductions: totals.totalDeductions,
          netPay: totals.netPay,
          paidHours: totals.paidHours,
          overtimeHours: totals.overtimeHours,
          attendanceDays: totals.attendanceDays,
          processedByStaffId: null,
        })
        await recordRepo.save(record)
        await deductionRepo.save(
          totals.deductions.map((item) => ({
            id: randomUUID(),
            payrollRecordId: record.id,
            deductionTypeId: deductionTypeByCode.get(item.code)!.id,
            deductionName: item.name,
            amount: item.amount,
            employerAmount: item.employerAmount,
            notes: item.notes,
          }))
        )
      }
      return { count: employees.length }
    })
    revalidatePath("/admin/payroll")
    return {
      ok: true,
      message: `Calculated payroll for ${generated.count} employee(s). Run it again after fixing any attendance punches.`,
    }
  } catch (error) {
    console.error("Unable to generate payroll:", error)
    const message = error instanceof Error ? error.message : ""
    const expected = [
      "Choose a valid payroll month and payday.",
      "This payroll period is already closed.",
      "No payroll-eligible employees were found for this cutoff. Add staff in Employees or check their hire and termination dates.",
      "Apply the attendance payroll migration before generating payroll.",
    ]
    return {
      ok: false,
      message: expected.includes(message)
        ? message
        : "Could not generate payroll. Check the database and attendance records.",
    }
  }
}
