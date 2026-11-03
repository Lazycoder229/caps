import type {
  EmploymentStatus,
  SalaryType,
} from "@/lib/database/entities/entities/enums"

export type EmployeeRow = {
  id: string
  userId: string
  name: string
  email: string
  contactNumber: string | null
  roleId: string
  roleName: string
  accountActive: boolean
  employeeNumber: string
  position: string
  department: string | null
  rfidCardUid: string | null
  dateHired: string
  dateTerminated: string | null
  employmentStatus: EmploymentStatus
  basicSalary: number
  salaryType: SalaryType
}

export type EmployeeRoleOption = { id: string; name: string }
