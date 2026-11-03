import { getInitializedDataSource } from "@/lib/database/data-source"
import { Employee } from "@/lib/database/entities/entities/Employee"
import { Role } from "@/lib/database/entities/entities/Role"
import { EmployeesWorkspace } from "./workspace"
import type { EmployeeRoleOption, EmployeeRow } from "./types"
import { requireAdministrator } from "@/lib/staff-auth/session"

export default async function EmployeesPage() {
  await requireAdministrator()
  try {
    const source = await getInitializedDataSource()
    const [employees, roles] = await Promise.all([
      source.getRepository(Employee).find({
        relations: { user: { role: true } },
        order: { employeeNumber: "ASC" },
      }),
      source.getRepository(Role).find({ order: { name: "ASC" } }),
    ])
    const rows: EmployeeRow[] = employees.map((employee) => ({
      id: employee.id,
      userId: employee.userId,
      name: employee.user.name,
      email: employee.user.email,
      contactNumber: employee.user.contactNumber,
      roleId: employee.user.roleId,
      roleName: employee.user.role?.name ?? "Unassigned",
      accountActive: employee.user.isActive,
      employeeNumber: employee.employeeNumber,
      position: employee.position,
      department: employee.department,
      rfidCardUid: employee.rfidCardUid,
      dateHired: String(employee.dateHired).slice(0, 10),
      dateTerminated: employee.dateTerminated
        ? String(employee.dateTerminated).slice(0, 10)
        : null,
      employmentStatus: employee.employmentStatus,
      basicSalary: Number(employee.basicSalary),
      salaryType: employee.salaryType,
    }))
    const roleOptions: EmployeeRoleOption[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
    }))
    return <EmployeesWorkspace employees={rows} roles={roleOptions} />
  } catch (error) {
    console.error("Unable to load employee management:", error)
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employee Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles, employment details, and pay rates.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          Employee records could not load. Check the database connection and
          apply the project migrations.
        </div>
      </main>
    )
  }
}
