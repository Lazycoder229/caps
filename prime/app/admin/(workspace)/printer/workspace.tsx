"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bluetooth,
  Cable,
  Network,
  Plus,
  Printer as PrinterIcon,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrinters } from "./hooks/use-printers"
import type { PrinterRow } from "./types"
import type {
  PrinterConnection,
  PrinterLocation,
} from "@/lib/database/entities/entities/enums"

type Draft = (Partial<PrinterRow> & { id: string }) | null
const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
const locations: {
  value: PrinterLocation
  title: string
  description: string
}[] = [
  {
    value: "counter",
    title: "Counter",
    description: "Customer receipts and cashier printouts",
  },
  {
    value: "kitchen",
    title: "Kitchen",
    description: "Kitchen order tickets (KOT)",
  },
]
const connectionLabels: Record<PrinterConnection, string> = {
  network: "Network / LAN",
  usb: "USB",
  bluetooth: "Bluetooth",
}

export function PrinterWorkspace({
  printers,
  printReceiptAuto,
  printKotAuto,
}: {
  printers: PrinterRow[]
  printReceiptAuto: boolean
  printKotAuto: boolean
}) {
  const [draft, setDraft] = useState<Draft>(null)
  const [query, setQuery] = useState("")
  const { pending, save, toggle, remove } = usePrinters()
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return printers.filter(
      (printer) =>
        !needle ||
        [
          printer.name,
          printer.location,
          connectionLabels[printer.connectionType],
          printer.ipAddress,
        ].some((value) => value?.toLowerCase().includes(needle))
    )
  }, [printers, query])
  const kitchenCount = printers.filter(
    (printer) => printer.location === "kitchen" && printer.isActive
  ).length
  const counterCount = printers.filter(
    (printer) => printer.location === "counter" && printer.isActive
  ).length

  function openNew(location?: PrinterLocation) {
    setDraft({
      id: "",
      name: "",
      location: location ?? "counter",
      connectionType: "network",
      ipAddress: "",
      isActive: true,
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await save(new FormData(event.currentTarget))
    if (result.ok) setDraft(null)
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Printer Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the printers used for counter receipts and kitchen order
            tickets.
          </p>
        </div>
        <Button size="sm" onClick={() => openNew()}>
          <Plus className="mr-1 size-4" />
          Add printer
        </Button>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <Summary title="Active counter printers" value={counterCount} />
        <Summary title="Active kitchen printers" value={kitchenCount} />
      </div>

      <Card size="sm" className="[--card-spacing:--spacing(3)]">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-base">Print behavior</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              These receipt preferences are saved in System Settings and shared
              by the POS.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/settings">
              <Settings2 className="mr-1 size-4" />
              Receipt preferences
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Preference
            active={printReceiptAuto}
            label="Receipt auto-print preference"
          />
          <Preference
            active={printKotAuto}
            label="Auto-print kitchen tickets"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Configured printers</h2>
          <p className="text-xs text-muted-foreground">
            A printer can be assigned to counter or kitchen output.
          </p>
        </div>
        <label className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search printers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search printers..."
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((printer) => (
            <Card
              key={printer.id}
              size="sm"
              className="[--card-spacing:--spacing(3)]"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${printer.isActive ? "bg-amber-500/10 text-amber-700" : "bg-muted text-muted-foreground"}`}
                  >
                    <PrinterIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">
                      {printer.name}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                      {printer.location} printer
                    </p>
                  </div>
                </div>
                <Badge variant={printer.isActive ? "secondary" : "outline"}>
                  {printer.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="gap-3">
                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <ConnectionIcon type={printer.connectionType} />
                  <span>{connectionLabels[printer.connectionType]}</span>
                </div>
                {printer.connectionType === "network" ? (
                  <p className="truncate text-xs text-muted-foreground">
                    IP / host:{" "}
                    <span className="font-medium text-foreground">
                      {printer.ipAddress || "Not configured"}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Connected through the POS device’s {printer.connectionType}{" "}
                    connection.
                  </p>
                )}
                <div className="flex flex-wrap justify-between gap-2 border-t pt-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => toggle(printer.id, !printer.isActive)}
                    >
                      {printer.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setDraft(printer)}
                    >
                      Edit
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${printer.name}`}
                    disabled={pending}
                    onClick={() => void remove(printer.id, printer.name)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card size="sm">
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <PrinterIcon className="size-7 text-muted-foreground" />
            <h2 className="mt-3 font-medium">
              {printers.length
                ? "No printers match your search"
                : "No printers configured"}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {printers.length
                ? "Try a different name, location, connection, or host."
                : "Add a counter printer for receipts or a kitchen printer for order tickets."}
            </p>
            {!printers.length ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openNew("counter")}
                >
                  <Plus className="mr-1 size-4" />
                  Counter printer
                </Button>
                <Button size="sm" onClick={() => openNew("kitchen")}>
                  <Plus className="mr-1 size-4" />
                  Kitchen printer
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {draft ? (
        <PrinterForm
          key={draft.id || "new-printer"}
          draft={draft}
          pending={pending}
          onClose={() => setDraft(null)}
          onSubmit={submit}
        />
      ) : null}
    </main>
  )
}

function PrinterForm({
  draft,
  pending,
  onClose,
  onSubmit,
}: {
  draft: Draft & {}
  pending: boolean
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  const [connection, setConnection] = useState<PrinterConnection>(
    draft.connectionType ?? "network"
  )
  const [isActive, setIsActive] = useState(draft.isActive ?? true)
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="printer-form-title"
        className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="printer-form-title" className="text-lg font-semibold">
              {draft.id ? "Edit printer" : "Add printer"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose where the printer is used and how the POS device connects
              to it.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={pending}
          >
            <X className="size-5" />
          </button>
        </header>
        <form className="space-y-3" onSubmit={onSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <input type="hidden" name="isActive" value={String(isActive)} />
          <Field label="Printer name">
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={draft.name}
              placeholder="Counter Receipt Printer"
              className={inputClass}
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Printer location">
              <select
                name="location"
                defaultValue={draft.location ?? "counter"}
                className={inputClass}
              >
                <option value="counter">Counter / receipts</option>
                <option value="kitchen">Kitchen / order tickets</option>
              </select>
            </Field>
            <Field label="Connection type">
              <select
                name="connectionType"
                value={connection}
                onChange={(event) =>
                  setConnection(event.target.value as PrinterConnection)
                }
                className={inputClass}
              >
                <option value="network">Network / LAN</option>
                <option value="usb">USB</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </Field>
          </div>
          {connection === "network" ? (
            <Field label="IP address or network host">
              <input
                name="ipAddress"
                required
                maxLength={50}
                defaultValue={draft.ipAddress ?? ""}
                placeholder="192.168.1.50 or printer.local"
                className={inputClass}
              />
              <span className="text-xs text-muted-foreground">
                Use the address reachable from the POS device.
              </span>
            </Field>
          ) : (
            <input type="hidden" name="ipAddress" value="" />
          )}
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            {connection === "network"
              ? "The printer entity stores the network address only. Confirm the printer is on the same LAN as the POS device."
              : connection === "usb"
                ? "USB printers must be installed and available to the computer running the POS."
                : "Bluetooth printers must be paired with the computer running the POS."}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="size-4 accent-amber-600"
            />
            Available for POS printing
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : draft.id ? "Save changes" : "Add printer"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ConnectionIcon({ type }: { type: PrinterConnection }) {
  if (type === "network")
    return <Network className="size-4 text-muted-foreground" />
  if (type === "bluetooth")
    return <Bluetooth className="size-4 text-muted-foreground" />
  return <Cable className="size-4 text-muted-foreground" />
}
function Preference({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`size-2 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
      />
      {label}: <span className="font-medium">{active ? "On" : "Off"}</span>
    </span>
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
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}
function Summary({ title, value }: { title: string; value: number }) {
  return (
    <Card size="sm" className="[--card-spacing:--spacing(1)]">
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className="text-base font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}
