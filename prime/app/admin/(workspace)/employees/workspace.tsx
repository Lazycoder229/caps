"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react"
import {
  EMPLOYMENT_STATUS,
  SALARY_TYPE,
} from "@/lib/database/entities/entities/enums"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEmployees } from "./hooks/use-employees"
import type { EmployeeRoleOption, EmployeeRow } from "./types"

type EmployeeDraft = Omit<EmployeeRow, "userId" | "roleName"> & {
  password: string
}

const inputClass = "h-9 w-full rounded-md border bg-background px-3 text-sm"
const labelClass =
  "grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground"

export function EmployeesWorkspace({
  employees,
  roles,
}: {
  employees: EmployeeRow[]
  roles: EmployeeRoleOption[]
}) {
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<EmployeeDraft | null>(null)
  const { pending, save, toggleAccount } = useEmployees()
  const filteredEmployees = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return employees
    return employees.filter((employee) =>
      [
        employee.name,
        employee.email,
        employee.employeeNumber,
        employee.position,
        employee.department ?? "",
        employee.roleName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    )
  }, [employees, query])

  function newEmployee() {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
    setDraft({
      id: "",
      name: "",
      email: "",
      contactNumber: null,
      roleId:
        roles.find((role) => role.name.trim().toLowerCase() === "staff")?.id ??
        roles[0]?.id ??
        "",
      accountActive: true,
      employeeNumber: "",
      position: "",
      department: null,
      rfidCardUid: null,
      dateHired: today,
      dateTerminated: null,
      employmentStatus: "active",
      basicSalary: 0,
      salaryType: "monthly",
      password: "",
    })
  }

  function editEmployee(employee: EmployeeRow) {
    setDraft({ ...employee, password: "" })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    const result = await save(new FormData(event.currentTarget))
    if (result.ok) setDraft(null)
  }

  const activeCount = employees.filter(
    (employee) => employee.employmentStatus === "active"
  ).length
  const leaveCount = employees.filter(
    (employee) => employee.employmentStatus === "on_leave"
  ).length
  const terminatedCount = employees.filter(
    (employee) => employee.employmentStatus === "terminated"
  ).length

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employee Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create employee accounts here. Staff can sign in at{" "}
            <Link
              href="/employee/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              the employee portal
            </Link>{" "}
            to view their attendance and payslips.
          </p>
        </div>
        <Button size="sm" onClick={newEmployee} disabled={!roles.length}>
          <Plus className="mr-1 size-4" /> New employee
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Summary label="Employees" value={employees.length} icon={Users} />
        <Summary label="Active" value={activeCount} icon={UserRound} />
        <Summary label="On leave" value={leaveCount} icon={UserRound} />
        <Summary
          label="Terminated"
          value={terminatedCount}
          icon={ShieldCheck}
        />
      </div>

      {!roles.length ? (
        <div
          role="status"
          className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
        >
          Create a staff role before adding an employee.{" "}
          <Link
            href="/admin/rbac"
            className="font-medium underline underline-offset-2"
          >
            Open Roles &amp; Access
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Staff directory</h2>
        <label className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} pl-9`}
            placeholder="Search employees..."
            aria-label="Search employees"
          />
        </label>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Employment</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Pay rate</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{employee.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {employee.employeeNumber} · {employee.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{employee.position}</div>
                    {employee.department ? (
                      <div className="text-xs text-muted-foreground">
                        {employee.department}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{employee.roleName}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        employee.employmentStatus === "active"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {statusLabel(employee.employmentStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={employee.accountActive ? "secondary" : "outline"}
                    >
                      {employee.accountActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    ₱
                    {employee.basicSalary.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                    <span className="ml-1 text-xs text-muted-foreground">
                      /{employee.salaryType === "daily" ? "day" : "month"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editEmployee(employee)}
                      >
                        <Pencil className="mr-1 size-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          pending || employee.employmentStatus === "terminated"
                        }
                        onClick={() =>
                          void toggleAccount({
                            id: employee.id,
                            name: employee.name,
                            active: employee.accountActive,
                          })
                        }
                      >
                        {employee.accountActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredEmployees.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="size-7 text-muted-foreground" />
                      <p className="mt-2 font-medium">
                        {query
                          ? "No matching employees"
                          : "No employee records yet"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {query
                          ? "Try another name, email, employee number, or role."
                          : "Create a staff account and link it to an employee record."}
                      </p>
                      {!query && roles.length ? (
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={newEmployee}
                        >
                          <Plus className="mr-1 size-4" /> Add employee
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {draft ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
            className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 id="employee-form-title" className="font-semibold">
                  {draft.id ? "Edit employee" : "New employee"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Save the staff login and HR record together.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={pending}
                onClick={() => setDraft(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </header>
            <form
              onSubmit={(event) => void submit(event)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                <input type="hidden" name="id" value={draft.id} />
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Staff account</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Full name">
                      <input
                        name="name"
                        required
                        maxLength={100}
                        defaultValue={draft.name}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        name="email"
                        type="email"
                        required
                        maxLength={255}
                        defaultValue={draft.email}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Contact number">
                      <input
                        name="contactNumber"
                        maxLength={20}
                        defaultValue={draft.contactNumber ?? ""}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Role">
                      <select
                        name="roleId"
                        required
                        defaultValue={draft.roleId}
                        className={inputClass}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label={
                        draft.id
                          ? "New password (optional)"
                          : "Temporary password"
                      }
                    >
                      <input
                        name="password"
                        type="password"
                        minLength={draft.id ? 8 : 8}
                        required={!draft.id}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder={
                          draft.id
                            ? "Leave blank to keep current password"
                            : "At least 8 characters"
                        }
                      />
                    </Field>
                    <Field label="Login account">
                      <select
                        name="accountActive"
                        defaultValue={String(draft.accountActive)}
                        className={inputClass}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </Field>
                  </div>
                </section>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Employee record</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Employee number">
                      <input
                        name="employeeNumber"
                        required
                        maxLength={20}
                        defaultValue={draft.employeeNumber}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Position">
                      <input
                        name="position"
                        required
                        maxLength={100}
                        defaultValue={draft.position}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Department">
                      <input
                        name="department"
                        maxLength={100}
                        defaultValue={draft.department ?? ""}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="RFID card UID">
                      <input
                        name="rfidCardUid"
                        maxLength={50}
                        defaultValue={draft.rfidCardUid ?? ""}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Date hired">
                      <input
                        name="dateHired"
                        type="date"
                        required
                        defaultValue={draft.dateHired}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Employment status">
                      <select
                        name="employmentStatus"
                        defaultValue={draft.employmentStatus}
                        className={inputClass}
                      >
                        {EMPLOYMENT_STATUS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Date terminated">
                      <input
                        name="dateTerminated"
                        type="date"
                        defaultValue={draft.dateTerminated ?? ""}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Basic salary">
                      <input
                        name="basicSalary"
                        type="number"
                        required
                        min="0"
                        max="99999999.99"
                        step="0.01"
                        defaultValue={draft.basicSalary}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Salary type">
                      <select
                        name="salaryType"
                        defaultValue={draft.salaryType}
                        className={inputClass}
                      >
                        {SALARY_TYPE.map((type) => (
                          <option key={type} value={type}>
                            {type === "daily" ? "Daily" : "Monthly"}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Employee records are retained for attendance and payroll
                    history. Mark an employee terminated instead of deleting the
                    record.
                  </p>
                </section>
              </div>
              <footer className="flex justify-end gap-2 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save employee"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Users
}) {
  return (
    <Card size="sm">
      <CardContent className="flex min-h-16 items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <strong className="text-lg tabular-nums">{value}</strong>
        </span>
      </CardContent>
    </Card>
  )
}

function statusLabel(status: EmployeeRow["employmentStatus"]) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
