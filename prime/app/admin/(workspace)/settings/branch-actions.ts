"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Branch } from "@/lib/database/entities/entities/Branch"
import { branchSchema } from "@/lib/validations/branch"

function textValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "on"
}

export type BranchActionResult =
  { ok: true; message: string } | { ok: false; message: string }

export async function saveBranch(
  formData: FormData
): Promise<BranchActionResult> {
  const parsed = branchSchema.safeParse({
    id: textValue(formData, "id"),
    name: textValue(formData, "name"),
    code: textValue(formData, "code"),
    type: textValue(formData, "type"),
    address: textValue(formData, "address"),
    contactNumber: textValue(formData, "contactNumber"),
    email: textValue(formData, "email"),
    isMain: boolValue(formData, "isMain"),
    isActive: boolValue(formData, "isActive"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Please check the branch details.",
    }
  }

  try {
    const dataSource = await getInitializedDataSource()
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Branch)
      const current = parsed.data.id
        ? await repository.findOneBy({ id: parsed.data.id })
        : null
      if (parsed.data.id && !current)
        throw new Error("Branch not found. Refresh and try again.")
      if (current?.isMain && !parsed.data.isMain) {
        throw new Error(
          "Set another branch as the main branch before changing this one."
        )
      }

      const branch = current ?? repository.create({ id: randomUUID() })
      if (parsed.data.isMain) {
        await repository
          .createQueryBuilder()
          .update(Branch)
          .set({ isMain: false })
          .where("isMain = :isMain", { isMain: true })
          .execute()
      }
      const { id: _id, ...branchValues } = parsed.data
      repository.merge(branch, branchValues, { updatedAt: new Date() })
      await repository.save(branch)
    })

    revalidatePath("/admin/settings")
    return { ok: true, message: "Branch saved." }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== "Branch not found. Refresh and try again." &&
      !error.message.includes("Set another branch")
    ) {
      const code = (error as Error & { code?: string }).code
      if (code === "ER_DUP_ENTRY")
        return { ok: false, message: "That branch code is already in use." }
      console.error("Unable to save branch:", error)
      return {
        ok: false,
        message:
          "Could not save the branch. Check the database connection and try again.",
      }
    }
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not save the branch.",
    }
  }
}

export async function setBranchActive(
  id: string,
  isActive: boolean
): Promise<BranchActionResult> {
  const parsedId = branchSchema.shape.id.safeParse(id)
  if (!parsedId.success || !parsedId.data)
    return { ok: false, message: "Invalid branch." }

  try {
    const dataSource = await getInitializedDataSource()
    const repository = dataSource.getRepository(Branch)
    const branch = await repository.findOneBy({ id: parsedId.data })
    if (!branch)
      return { ok: false, message: "Branch not found. Refresh and try again." }
    if (!isActive && branch.isMain) {
      return {
        ok: false,
        message:
          "Set another branch as the main branch before deactivating this one.",
      }
    }

    await repository.update(
      { id: branch.id },
      { isActive, updatedAt: new Date() }
    )
    revalidatePath("/admin/settings")
    return {
      ok: true,
      message: isActive ? "Branch activated." : "Branch deactivated.",
    }
  } catch (error) {
    console.error("Unable to change branch status:", error)
    return {
      ok: false,
      message:
        "Could not update the branch. Check the database connection and try again.",
    }
  }
}
