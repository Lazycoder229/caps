/** Supported values for `branches.type`; mirrored from the current DB records. */
export const BRANCH_TYPES = ["main", "branch"] as const
export type BranchType = (typeof BRANCH_TYPES)[number]

export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  main: "Main branch",
  branch: "Branch",
}
