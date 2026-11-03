import { getInitializedDataSource } from "@/lib/database/data-source"
import { Printer } from "@/lib/database/entities/entities/Printer"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { PrinterWorkspace } from "./workspace"
import type { PrinterRow } from "./types"

export default async function PrinterSettingsPage() {
  try {
    const source = await getInitializedDataSource()
    const [printers, setting] = await Promise.all([
      source
        .getRepository(Printer)
        .find({ order: { location: "ASC", name: "ASC" } }),
      source.getRepository(SystemSetting).findOne({ where: {} }),
    ])
    const rows: PrinterRow[] = printers.map((printer) => ({
      id: printer.id,
      name: printer.name,
      location: printer.location,
      connectionType: printer.connectionType,
      ipAddress: printer.ipAddress,
      isActive: printer.isActive,
    }))
    return (
      <PrinterWorkspace
        printers={rows}
        printReceiptAuto={setting?.printReceiptAuto ?? true}
        printKotAuto={setting?.printKotAuto ?? true}
      />
    )
  } catch (error) {
    console.error("Unable to load printer settings:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Printer Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure kitchen and counter printers for your POS.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect printer settings."
            : "Printer settings could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
