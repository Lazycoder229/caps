import { z } from "zod"
import { BRANCH_TYPES } from "@/lib/database/entities/branch-types"

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)

export const branchSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .or(z.literal(""))
      .transform((value) => value || null),
    name: z.string().trim().min(1, "Branch name is required.").max(120),
    code: z
      .string()
      .trim()
      .min(1, "Branch code is required.")
      .max(30)
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Use letters, numbers, hyphens, or underscores for the code."
      )
      .transform((value) => value.toUpperCase()),
    type: z.enum(BRANCH_TYPES),
    address: optionalText(65_535),
    contactNumber: optionalText(50),
    email: z
      .union([z.email().max(120), z.literal("")])
      .transform((value) => value || null),
    isMain: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((branch) => !branch.isMain || branch.isActive, {
    message: "The main branch must remain active.",
    path: ["isActive"],
  })

export type BranchInput = z.infer<typeof branchSchema>
