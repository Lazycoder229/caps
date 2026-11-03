import { BriefcaseBusiness, IdCard, UserRound } from "lucide-react"
import { getEmployeeData } from "../data"
import { EmployeeAccountForm } from "./workspace"

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export default async function EmployeeAccountPage() {
  const { staff, employee } = await getEmployeeData()
  return (
    <main className="mx-auto w-full max-w-5xl space-y-3">
      <section className="flex flex-col gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(staff.name) || <UserRound className="size-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">My profile <span className="font-normal text-muted-foreground">· {staff.name}</span></h1>
            <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs">
            <IdCard className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">No.</span>
            <span className="font-medium">{employee.employeeNumber}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs">
            <BriefcaseBusiness className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{employee.position || "Employee"}</span>
          </div>
        </div>
      </section>

      <EmployeeAccountForm
        name={staff.name}
        email={staff.email}
        contactNumber={employee.user.contactNumber ?? ""}
      />

    </main>
  )
}
