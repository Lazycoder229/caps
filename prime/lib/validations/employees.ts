import { z } from "zod"
import {
  EMPLOYMENT_STATUS,
  SALARY_TYPE,
} from "@/lib/database/entities/entities/enums"

const uuid = z.string().uuid()
const dateOnly = z.iso.date()

export const employeeSchema = z
  .object({
    id: uuid.or(z.literal("")),
    name: z.string().trim().min(1).max(100),
    email: z.email().max(255),
    contactNumber: z
      .string()
      .trim()
      .max(20)
      .transform((value) => value || null),
    roleId: uuid,
    password: z.string().max(100),
    accountActive: z.boolean(),
    employeeNumber: z.string().trim().min(1).max(20),
    position: z.string().trim().min(1).max(100),
    department: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value || null),
    rfidCardUid: z
      .string()
      .trim()
      .max(50)
      .transform((value) => value || null),
    dateHired: dateOnly,
    dateTerminated: z
      .union([dateOnly, z.literal("")])
      .transform((value) => value || null),
    employmentStatus: z.enum(EMPLOYMENT_STATUS),
    basicSalary: z.coerce.number().min(0).max(99_999_999.99),
    salaryType: z.enum(SALARY_TYPE),
  })
  .refine((data) => data.id || data.password.length >= 8, {
    message:
      "A password with at least 8 characters is required for a new account.",
    path: ["password"],
  })
  .refine((data) => !data.id || !data.password || data.password.length >= 8, {
    message: "A new password must have at least 8 characters.",
    path: ["password"],
  })
  .refine(
    (data) => data.employmentStatus !== "terminated" || !!data.dateTerminated,
    {
      message: "Set the termination date for a terminated employee.",
      path: ["dateTerminated"],
    }
  )
  .refine(
    (data) => !data.dateTerminated || data.dateTerminated >= data.dateHired,
    {
      message: "The termination date must be on or after the hire date.",
      path: ["dateTerminated"],
    }
  )

export const employeeIdSchema = uuid

export type EmployeeInput = z.infer<typeof employeeSchema>
