"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { Role } from "@/lib/database/entities/entities/Role"
import { User } from "@/lib/database/entities/entities/User"
import { hashPassword } from "@/lib/security/password"
import { employeeIdSchema, employeeSchema } from "@/lib/validations/employees"
import { requireAdministrator } from "@/lib/staff-auth/session"

function refreshEmployees() {
  revalidatePath("/admin/employees")
  revalidatePath("/admin/rbac")
}

export async function saveEmployee(data: FormData) {
  await requireAdministrator()
  const parsed = employeeSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    email: String(data.get("email") ?? "")
      .trim()
      .toLowerCase(),
    contactNumber: String(data.get("contactNumber") ?? ""),
    roleId: String(data.get("roleId") ?? ""),
    password: String(data.get("password") ?? ""),
    accountActive: data.get("accountActive") === "true",
    employeeNumber: String(data.get("employeeNumber") ?? ""),
    position: String(data.get("position") ?? ""),
    department: String(data.get("department") ?? ""),
    rfidCardUid: String(data.get("rfidCardUid") ?? ""),
    dateHired: String(data.get("dateHired") ?? ""),
    dateTerminated: String(data.get("dateTerminated") ?? ""),
    employmentStatus: String(data.get("employmentStatus") ?? ""),
    basicSalary: String(data.get("basicSalary") ?? ""),
    salaryType: String(data.get("salaryType") ?? ""),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the employee details.",
    }

  try {
    await (
      await getInitializedDataSource()
    ).transaction(async (manager) => {
      const employeeRepository = manager.getRepository(Employee)
      const userRepository = manager.getRepository(User)
      const role = await manager
        .getRepository(Role)
        .findOneBy({ id: parsed.data.roleId })
      if (!role) throw new Error("Choose a valid staff role.")
      const existingEmployee = parsed.data.id
        ? await employeeRepository.findOne({
            where: { id: parsed.data.id },
            relations: { user: true },
          })
        : null
      if (parsed.data.id && !existingEmployee)
        throw new Error("Employee not found. Refresh and try again.")

      const duplicateNumber = await employeeRepository.findOneBy({
        employeeNumber: parsed.data.employeeNumber,
      })
      if (duplicateNumber && duplicateNumber.id !== parsed.data.id)
        throw new Error("That employee number is already in use.")

      const duplicateEmail = await userRepository.findOneBy({
        email: parsed.data.email,
      })
      if (duplicateEmail && duplicateEmail.id !== existingEmployee?.userId)
        throw new Error("That email address already has a staff account.")

      if (parsed.data.id) {
        const employee = existingEmployee!
        employee.user.name = parsed.data.name
        employee.user.email = parsed.data.email
        employee.user.contactNumber = parsed.data.contactNumber
        employee.user.roleId = role.id
        employee.user.role = role
        employee.user.isActive =
          parsed.data.employmentStatus === "terminated"
            ? false
            : parsed.data.accountActive
        employee.user.updatedAt = new Date()
        if (parsed.data.password)
          employee.user.password = hashPassword(parsed.data.password)
        employee.employeeNumber = parsed.data.employeeNumber
        employee.position = parsed.data.position
        employee.department = parsed.data.department
        employee.rfidCardUid = parsed.data.rfidCardUid?.toUpperCase() ?? null
        employee.dateHired = parsed.data.dateHired
        employee.dateTerminated = parsed.data.dateTerminated
        employee.employmentStatus = parsed.data.employmentStatus
        employee.basicSalary = parsed.data.basicSalary
        employee.salaryType = parsed.data.salaryType
        await userRepository.save(employee.user)
        await employeeRepository.save(employee)
        return
      }

      const user = userRepository.create({
        id: randomUUID(),
        roleId: role.id,
        role,
        email: parsed.data.email,
        password: hashPassword(parsed.data.password),
        name: parsed.data.name,
        contactNumber: parsed.data.contactNumber,
        isActive:
          parsed.data.employmentStatus === "terminated"
            ? false
            : parsed.data.accountActive,
        lastLoginAt: null,
        updatedAt: null,
      })
      await userRepository.save(user)
      const employee = employeeRepository.create({
        id: randomUUID(),
        userId: user.id,
        employeeNumber: parsed.data.employeeNumber,
        position: parsed.data.position,
        department: parsed.data.department,
        rfidCardUid: parsed.data.rfidCardUid?.toUpperCase() ?? null,
        dateHired: parsed.data.dateHired,
        dateTerminated: parsed.data.dateTerminated,
        employmentStatus: parsed.data.employmentStatus,
        basicSalary: parsed.data.basicSalary,
        salaryType: parsed.data.salaryType,
      })
      await employeeRepository.save(employee)
    })
    refreshEmployees()
    return {
      ok: true,
      message: parsed.data.id
        ? "Employee updated."
        : "Employee account created.",
    }
  } catch (error) {
    console.error("Unable to save employee:", error)
    const message = error instanceof Error ? error.message : ""
    const expectedMessages = [
      "Choose a valid staff role.",
      "That employee number is already in use.",
      "That email address already has a staff account.",
      "Employee not found. Refresh and try again.",
    ]
    return {
      ok: false,
      message: expectedMessages.includes(message)
        ? message
        : "Could not save the employee. Check the database connection.",
    }
  }
}

export async function setEmployeeAccountActive(
  idValue: string,
  active: boolean
) {
  await requireAdministrator()
  const parsed = employeeIdSchema.safeParse(idValue)
  if (!parsed.success) return { ok: false, message: "Invalid employee." }
  try {
    const repository = (await getInitializedDataSource()).getRepository(
      Employee
    )
    const employee = await repository.findOne({
      where: { id: parsed.data },
      relations: { user: true },
    })
    if (!employee) return { ok: false, message: "Employee not found." }
    if (employee.employmentStatus === "terminated" && active)
      return {
        ok: false,
        message:
          "A terminated employee must be reinstated before activating the account.",
      }
    employee.user.isActive = active
    employee.user.updatedAt = new Date()
    await repository.manager.getRepository(User).save(employee.user)
    refreshEmployees()
    return {
      ok: true,
      message: active
        ? "Staff account activated."
        : "Staff account deactivated.",
    }
  } catch (error) {
    console.error("Unable to change staff account status:", error)
    return { ok: false, message: "Could not change the staff account status." }
  }
}
