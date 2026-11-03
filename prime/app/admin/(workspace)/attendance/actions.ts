"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { AttendanceLog } from "@/lib/database/entities/entities/AttendanceLog"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { readPayrollCalculationSettings } from "@/lib/payroll/settings"
import { rfidTapSchema } from "@/lib/validations/attendance"

function manilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export async function recordRfidTap(uid: string) {
  const parsed = rfidTapSchema.safeParse({ rfid_card_uid: uid })
  if (!parsed.success)
    return { ok: false, message: "Enter a valid RFID card UID." }
  const cardUid = parsed.data.rfid_card_uid.toUpperCase()
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const employee = await manager
        .getRepository(Employee)
        .findOneBy({ rfidCardUid: cardUid })
      if (!employee || employee.employmentStatus !== "active")
        throw new Error("No active employee is assigned to this RFID card.")
      const date = manilaDate()
      const payrollSettings = readPayrollCalculationSettings(
        await manager.getRepository(SystemSetting).findOne({
          where: {},
          select: {
            id: true,
            payrollDutyHours: true,
            payrollUnpaidBreakHours: true,
            payrollWorkdaysPerMonth: true,
            payrollOvertimeMultiplier: true,
          },
        })
      )
      const logs = manager.getRepository(AttendanceLog)
      const openLog = await logs
        .createQueryBuilder("log")
        .where("log.employeeId = :employeeId", { employeeId: employee.id })
        .andWhere("log.logDate = :date", { date })
        .andWhere("log.clockOut IS NULL")
        .orderBy("log.createdAt", "DESC")
        .getOne()
      if (!openLog) {
        const completedIntervals = await logs
          .createQueryBuilder("log")
          .where("log.employeeId = :employeeId", { employeeId: employee.id })
          .andWhere("log.logDate = :date", { date })
          .andWhere("log.clockOut IS NOT NULL")
          .getCount()
        if (completedIntervals >= 2)
          throw new Error(
            "This employee already completed both attendance intervals today."
          )
        const log = logs.create({
          id: randomUUID(),
          employeeId: employee.id,
          logDate: date,
          clockIn: new Date(),
          clockOut: null,
          totalHours: null,
          lateMinutes: 0,
          overtimeHours: 0,
          status: "incomplete",
          method: "rfid",
          rfidCardUidUsed: cardUid,
          notes: null,
        })
        await logs.save(log)
        return `Clock-in recorded for employee ${employee.employeeNumber}.`
      }
      if (!openLog.clockIn)
        throw new Error("The open attendance record has no clock-in time.")
      const hours = Math.max(
        0,
        (Date.now() - openLog.clockIn.getTime()) / 3_600_000
      )
      if (hours > 24)
        throw new Error(
          "This shift is over 24 hours. Ask an admin to correct the attendance record."
        )
      openLog.clockOut = new Date()
      openLog.totalHours = Math.round(hours * 100) / 100
      const overtimeStart =
        payrollSettings.payrollDutyHours +
        payrollSettings.payrollUnpaidBreakHours
      openLog.overtimeHours =
        Math.round(Math.max(0, hours - overtimeStart) * 100) / 100
      openLog.status = hours > overtimeStart ? "overtime" : "on_time"
      await logs.save(openLog)
      return `Clock-out recorded (${openLog.totalHours} hours).`
    })
    revalidatePath("/admin/attendance")
    revalidatePath("/admin/payroll")
    revalidatePath("/admin/settings")
    return { ok: true, message: result }
  } catch (error) {
    console.error("Unable to record RFID attendance:", error)
    const message = error instanceof Error ? error.message : ""
    const expected = [
      "No active employee is assigned to this RFID card.",
      "This employee already completed both attendance intervals today.",
      "The open attendance record has no clock-in time.",
      "This shift is over 24 hours. Ask an admin to correct the attendance record.",
    ]
    return {
      ok: false,
      message: expected.includes(message)
        ? message
        : "Could not record attendance. Check the database connection.",
    }
  }
}
