"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Printer } from "@/lib/database/entities/entities/Printer"
import { printerIdSchema, printerSchema } from "@/lib/validations/printers"

export type PrinterActionResult =
  { ok: true; message: string } | { ok: false; message: string }

function revalidatePrinterSettings() {
  revalidatePath("/admin/printer")
  revalidatePath("/admin/settings")
}

export async function savePrinter(
  data: FormData
): Promise<PrinterActionResult> {
  const parsed = printerSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    location: String(data.get("location") ?? ""),
    connectionType: String(data.get("connectionType") ?? ""),
    ipAddress: String(data.get("ipAddress") ?? ""),
    isActive: data.get("isActive") === "true",
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the printer details.",
    }

  try {
    const repository = (await getInitializedDataSource()).getRepository(Printer)
    const printer = parsed.data.id
      ? await repository.findOneBy({ id: parsed.data.id })
      : repository.create({ id: randomUUID() })
    if (!printer)
      return { ok: false, message: "Printer not found. Refresh and try again." }
    printer.name = parsed.data.name
    printer.location = parsed.data.location
    printer.connectionType = parsed.data.connectionType
    printer.ipAddress =
      parsed.data.connectionType === "network" ? parsed.data.ipAddress : null
    printer.isActive = parsed.data.isActive
    await repository.save(printer)
    revalidatePrinterSettings()
    return { ok: true, message: "Printer saved." }
  } catch (error) {
    console.error("Unable to save printer:", error)
    return {
      ok: false,
      message: "Could not save printer. Check the database connection.",
    }
  }
}

export async function setPrinterActive(
  idValue: string,
  active: boolean
): Promise<PrinterActionResult> {
  const id = printerIdSchema.safeParse(idValue)
  if (!id.success || typeof active !== "boolean")
    return { ok: false, message: "Choose a valid printer and status." }
  try {
    const repository = (await getInitializedDataSource()).getRepository(Printer)
    const printer = await repository.findOneBy({ id: id.data })
    if (!printer) return { ok: false, message: "Printer not found." }
    printer.isActive = active
    await repository.save(printer)
    revalidatePrinterSettings()
    return {
      ok: true,
      message: active ? "Printer activated." : "Printer deactivated.",
    }
  } catch (error) {
    console.error("Unable to change printer status:", error)
    return { ok: false, message: "Could not change printer status." }
  }
}

export async function deletePrinter(
  idValue: string
): Promise<PrinterActionResult> {
  const id = printerIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid printer." }
  try {
    const repository = (await getInitializedDataSource()).getRepository(Printer)
    const result = await repository.delete({ id: id.data })
    if (!result.affected) return { ok: false, message: "Printer not found." }
    revalidatePrinterSettings()
    return { ok: true, message: "Printer deleted." }
  } catch (error) {
    console.error("Unable to delete printer:", error)
    return { ok: false, message: "Could not delete printer." }
  }
}
