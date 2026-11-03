"use client"

import {
  Building2,
  Calculator,
  Clock3,
  CreditCard,
  Eye,
  Award,
  ReceiptText,
  Save,
  Store,
  Tags,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReceiptTemplate } from "@/components/receipt/receipt-template"
import { useAdminFeedback } from "@/components/admin-feedback"
import { BranchManagement } from "./branch-management"
import { useSettings } from "./hooks/use-settings"
import type { BranchSummary, SystemSettingsFormValues } from "./types"

const controlClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
const settingTabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "taxes", label: "Taxes", icon: Tags },
  { id: "loyalty", label: "Points & Loyalty", icon: Award },
  { id: "orders", label: "Orders", icon: Clock3 },
  { id: "receipt", label: "Receipt & Wi-Fi", icon: ReceiptText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "branches", label: "Branches", icon: Store },
  { id: "payroll", label: "Payroll", icon: Calculator },
] as const
const fieldTab: Record<string, (typeof settingTabs)[number]["id"]> = {
  restaurantName: "general",
  branchName: "general",
  contactNumber: "general",
  email: "general",
  address: "general",
  tinNumber: "general",
  birMin: "general",
  currencySymbol: "taxes",
  currencyCode: "taxes",
  timezone: "taxes",
  vatRate: "taxes",
  vatEnabled: "taxes",
  vatInclusive: "taxes",
  serviceChargeEnabled: "taxes",
  serviceChargeRate: "taxes",
  seniorPwdDiscountEnabled: "taxes",
  pointsPerTier: "loyalty",
  pesoValuePerPoint: "loyalty",
  orderNumberPrefix: "orders",
  openingTime: "orders",
  closingTime: "orders",
  lowStockThresholdAlert: "orders",
  autoAcceptQrOrders: "orders",
  requireTableSelection: "orders",
  deliveryEnabled: "orders",
  deliveryFee: "orders",
  deliveryMinimumOrder: "orders",
  managerApprovalForVoids: "orders",
  cashDrawerOpeningBalanceRequired: "orders",
  payrollDutyHours: "payroll",
  payrollUnpaidBreakHours: "payroll",
  payrollWorkdaysPerMonth: "payroll",
  payrollOvertimeMultiplier: "payroll",
  payrollSssEmployeeShare: "payroll",
  payrollSssEmployerShare: "payroll",
  payrollPhilhealthEmployeeShare: "payroll",
  payrollPhilhealthEmployerShare: "payroll",
  payrollPagibigEmployeeShare: "payroll",
  payrollPagibigEmployerShare: "payroll",
  payrollMealsDeduction: "payroll",
  receiptHeader: "receipt",
  receiptFooter: "receipt",
  wifiSsid: "receipt",
  wifiPassword: "receipt",
  printReceiptAuto: "receipt",
  printKotAuto: "receipt",
  showWifiOnReceipt: "receipt",
  gcashQrImage: "payments",
  mayaQrImage: "payments",
}

function Field({
  name,
  label,
  value,
  type = "text",
  required = false,
  min,
  max,
  step,
  error,
  hint,
  controlledValue,
  onValueChange,
}: {
  name: string
  label: string
  value: string | number | null
  type?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  error?: string
  hint?: string
  controlledValue?: string
  onValueChange?: (value: string) => void
}) {
  const id = `setting-${name}`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        type={type}
        {...(onValueChange
          ? {
              value: controlledValue ?? "",
              onChange: (event) => onValueChange(event.target.value),
            }
          : { defaultValue: value ?? "" })}
        required={required}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function TextAreaField({
  name,
  label,
  value,
  error,
  hint,
  controlledValue,
  onValueChange,
}: {
  name: string
  label: string
  value: string | null
  error?: string
  hint?: string
  controlledValue?: string
  onValueChange?: (value: string) => void
}) {
  const id = `setting-${name}`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        {...(onValueChange
          ? {
              value: controlledValue ?? "",
              onChange: (event) => onValueChange(event.target.value),
            }
          : { defaultValue: value ?? "" })}
        rows={onValueChange ? 2 : 3}
        className={`${controlClass} ${onValueChange ? "min-h-14" : "min-h-20"} resize-y aria-invalid:border-destructive`}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Toggle({
  name,
  label,
  description,
  checked,
  onCheckedChange,
  compact = false,
}: {
  name: string
  label: string
  description: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  compact?: boolean
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-lg border ${compact ? "min-h-12 p-2" : "min-h-16 gap-3 p-3"}`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        onChange={
          onCheckedChange
            ? (event) => onCheckedChange(event.target.checked)
            : undefined
        }
        className="mt-0.5 size-4 shrink-0 accent-amber-600"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span
          className={`${compact ? "text-[11px]" : "text-xs"} mt-0.5 block text-muted-foreground`}
        >
          {description}
        </span>
      </span>
    </label>
  )
}

function Section({
  title,
  description,
  children,
  compact = false,
}: {
  title: string
  description: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <section
      className={`${compact ? "space-y-3 pb-4" : "space-y-4 pb-6"} border-b last:border-b-0 last:pb-0`}
    >
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function SettingsForm({
  initialValues,
  hasGcashQr,
  hasMayaQr,
  hasQrphQr,
  hasWifiPassword,
  branches,
}: {
  initialValues: SystemSettingsFormValues
  hasGcashQr: boolean
  hasMayaQr: boolean
  hasQrphQr: boolean
  hasWifiPassword: boolean
  branches: BranchSummary[]
}) {
  const { state, formAction, pending } = useSettings()
  const { toast } = useAdminFeedback()
  const errors = state.fieldErrors ?? {}
  const errorFor = (name: string) => errors[name]?.[0]
  const [qrImages, setQrImages] = useState({ gcash: "", maya: "", qrph: "" })
  const [activeTab, setActiveTab] =
    useState<(typeof settingTabs)[number]["id"]>("general")
  const [receiptHeader, setReceiptHeader] = useState(
    initialValues.receiptHeader ?? ""
  )
  const [receiptFooter, setReceiptFooter] = useState(
    initialValues.receiptFooter ?? ""
  )
  const [wifiSsid, setWifiSsid] = useState(initialValues.wifiSsid ?? "")
  const [wifiPassword, setWifiPassword] = useState("")
  const [showWifiOnReceipt, setShowWifiOnReceipt] = useState(
    initialValues.showWifiOnReceipt
  )
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false)

  useEffect(() => {
    const firstError = Object.keys(state.fieldErrors ?? {})[0]
    if (firstError && fieldTab[firstError]) setActiveTab(fieldTab[firstError])
  }, [state.fieldErrors])

  useEffect(() => {
    if (state.message)
      toast(state.status === "success" ? "success" : "error", state.message)
  }, [state, toast])

  useEffect(() => {
    if (!receiptPreviewOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setReceiptPreviewOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [receiptPreviewOpen])

  function readQrImage(kind: "gcash" | "maya" | "qrph", file?: File) {
    if (!file) return
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast(
        "error",
        "Invalid image",
        "Choose a PNG, JPG, or WebP image."
      )
      return
    }
    if (file.size > 300 * 1024) {
      toast(
        "error",
        "QR image is too large",
        "The maximum file size is 300 KB."
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setQrImages((current) => ({
        ...current,
        [kind]: String(reader.result ?? ""),
      }))
    }
    reader.onerror = () =>
      toast(
        "error",
        "Could not read the image",
        "Choose another file and try again."
      )
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <nav
        aria-label="System settings sections"
        className="-mx-1 flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1"
      >
        {settingTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={activeTab === id ? "page" : undefined}
            onClick={() => setActiveTab(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${activeTab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"}`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <form
        action={formAction}
        noValidate
        className="space-y-4"
        hidden={activeTab === "branches"}
      >
        <input
          type="hidden"
          name="branchId"
          value={initialValues.branchId ?? ""}
        />
        <input type="hidden" name="gcashQrImage" value={qrImages.gcash} />
        <input type="hidden" name="mayaQrImage" value={qrImages.maya} />
        <input type="hidden" name="qrphQrImage" value={qrImages.qrph} />
        <div hidden={activeTab !== "general"}>
          <Section
            compact
            title="Business details"
            description="Restaurant identity and main branch details."
          >
            {!initialValues.branchId ? (
              <p
                role="status"
                className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
              >
                No main branch is set. Choose one in the Branches tab to use its
                name and contact details here.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                name="restaurantName"
                label="Restaurant name"
                value={initialValues.restaurantName}
                required
                error={errorFor("restaurantName")}
              />
              <Field
                name="branchName"
                label="Branch name"
                value={initialValues.branchName}
                required
                error={errorFor("branchName")}
              />
              <Field
                name="contactNumber"
                label="Contact number"
                value={initialValues.contactNumber}
                required
                error={errorFor("contactNumber")}
              />
              <Field
                name="email"
                label="Email"
                value={initialValues.email}
                type="email"
                required
                error={errorFor("email")}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  name="address"
                  label="Address"
                  value={initialValues.address}
                  error={errorFor("address")}
                />
              </div>
              <Field
                name="tinNumber"
                label="TIN number"
                value={initialValues.tinNumber}
                error={errorFor("tinNumber")}
              />
              <Field
                name="birMin"
                label="BIR MIN"
                value={initialValues.birMin}
                error={errorFor("birMin")}
              />
            </div>
          </Section>
        </div>

        <div hidden={activeTab !== "taxes"}>
          <Section
            compact
            title="Currency and tax"
            description="Currency display, VAT, and service charge rules."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                name="currencySymbol"
                label="Currency symbol"
                value={initialValues.currencySymbol}
                required
                error={errorFor("currencySymbol")}
              />
              <Field
                name="currencyCode"
                label="Currency code"
                value={initialValues.currencyCode}
                required
                error={errorFor("currencyCode")}
              />
              <Field
                name="timezone"
                label="Timezone"
                value={initialValues.timezone}
                required
                error={errorFor("timezone")}
              />
              <Field
                name="vatRate"
                label="VAT rate (%)"
                value={initialValues.vatRate}
                type="number"
                min={0}
                max={100}
                step={0.01}
                error={errorFor("vatRate")}
              />
              <Field
                name="serviceChargeRate"
                label="Service charge (%)"
                value={initialValues.serviceChargeRate}
                type="number"
                min={0}
                max={100}
                step={0.01}
                error={errorFor("serviceChargeRate")}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                compact
                name="vatEnabled"
                label="Enable VAT"
                description="Apply VAT to orders."
                checked={initialValues.vatEnabled}
              />
              <Toggle
                compact
                name="vatInclusive"
                label="VAT-inclusive prices"
                description="Menu prices already include VAT."
                checked={initialValues.vatInclusive}
              />
              <Toggle
                compact
                name="serviceChargeEnabled"
                label="Enable service charge"
                description="Apply service charge to orders."
                checked={initialValues.serviceChargeEnabled}
              />
              <Toggle
                compact
                name="seniorPwdDiscountEnabled"
                label="Senior / PWD discount"
                description="Allow discount at checkout."
                checked={initialValues.seniorPwdDiscountEnabled}
              />
            </div>
          </Section>
        </div>

        <div hidden={activeTab !== "orders"}>
          <Section
            compact
            title="Orders and operating hours"
            description="Order numbering, QR order behavior, and cashier controls."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                name="orderNumberPrefix"
                label="Order number prefix"
                value={initialValues.orderNumberPrefix}
                required
                error={errorFor("orderNumberPrefix")}
              />
              <Field
                name="openingTime"
                label="Opening time"
                value={initialValues.openingTime}
                type="time"
                required
                error={errorFor("openingTime")}
              />
              <Field
                name="closingTime"
                label="Closing time"
                value={initialValues.closingTime}
                type="time"
                required
                error={errorFor("closingTime")}
              />
              <Field
                name="lowStockThresholdAlert"
                label="Low-stock alert threshold"
                value={initialValues.lowStockThresholdAlert}
                type="number"
                min={0}
                step={1}
                error={errorFor("lowStockThresholdAlert")}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                compact
                name="autoAcceptQrOrders"
                label="Auto-accept QR orders"
                description="Accept without manual review."
                checked={initialValues.autoAcceptQrOrders}
              />
              <Toggle
                compact
                name="requireTableSelection"
                label="Require table selection"
                description="Choose a table before ordering."
                checked={initialValues.requireTableSelection}
              />
              <Toggle
                compact
                name="deliveryEnabled"
                label="Accept delivery orders"
                description="Allow customers to choose delivery at checkout."
                checked={initialValues.deliveryEnabled}
              />
              <Toggle
                compact
                name="managerApprovalForVoids"
                label="Manager approval for voids"
                description="Approve before voiding an order."
                checked={initialValues.managerApprovalForVoids}
              />
              <Toggle
                compact
                name="cashDrawerOpeningBalanceRequired"
                label="Require opening cash balance"
                description="Enter drawer balance at shift start."
                checked={initialValues.cashDrawerOpeningBalanceRequired}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                name="deliveryFee"
                label="Flat delivery fee"
                value={initialValues.deliveryFee}
                type="number"
                min={0}
                step={0.01}
                error={errorFor("deliveryFee")}
              />
              <Field
                name="deliveryMinimumOrder"
                label="Minimum delivery order"
                value={initialValues.deliveryMinimumOrder}
                type="number"
                min={0}
                step={0.01}
                error={errorFor("deliveryMinimumOrder")}
              />
            </div>
          </Section>
        </div>

        <div hidden={activeTab !== "loyalty"}>
          <Section
            compact
            title="Points system"
            description="Set how customers earn points on completed, paid orders and the reference cash value of each point."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                name="pointsPerTier"
                label="Points per spending tier"
                value={initialValues.pointsPerTier}
                type="number"
                min={0}
                max={99_999}
                step={1}
                hint="Set to 0 to disable earning. With 5: ₱100 earns 5 pts, ₱200 earns 10, then each additional ₱200 adds 5 pts."
                error={errorFor("pointsPerTier")}
              />
              <Field
                name="pesoValuePerPoint"
                label="Peso value per point (₱)"
                value={initialValues.pesoValuePerPoint}
                type="number"
                min={0}
                max={999.99}
                step={0.01}
                hint="Reference value for reward planning; reward point costs are still configured per reward."
                error={errorFor("pesoValuePerPoint")}
              />
            </div>
          </Section>
        </div>

        <div hidden={activeTab !== "payroll"}>
          <div className="space-y-4">
            <Section
              compact
              title="Payroll calculation"
              description="These saved rules are used for RFID attendance and payroll generation. Existing payroll drafts are not recalculated until you run Calculate payroll again."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  name="payrollDutyHours"
                  label="Paid duty hours per shift"
                  value={initialValues.payrollDutyHours}
                  type="number"
                  min={0.25}
                  max={24}
                  step={0.25}
                  hint="Maximum regular paid hours counted per shift."
                  error={errorFor("payrollDutyHours")}
                />
                <Field
                  name="payrollUnpaidBreakHours"
                  label="Unpaid break hours"
                  value={initialValues.payrollUnpaidBreakHours}
                  type="number"
                  min={0}
                  max={24}
                  step={0.25}
                  hint="Subtracted from long shifts before paid hours are counted."
                  error={errorFor("payrollUnpaidBreakHours")}
                />
                <Field
                  name="payrollWorkdaysPerMonth"
                  label="Payroll workdays per month"
                  value={initialValues.payrollWorkdaysPerMonth}
                  type="number"
                  min={1}
                  max={31}
                  step={0.5}
                  hint="Used to convert monthly and daily salary rates."
                  error={errorFor("payrollWorkdaysPerMonth")}
                />
                <Field
                  name="payrollOvertimeMultiplier"
                  label="Overtime pay multiplier"
                  value={initialValues.payrollOvertimeMultiplier}
                  type="number"
                  min={1}
                  max={5}
                  step={0.05}
                  hint="For example, 1.25 means 125% of the hourly rate."
                  error={errorFor("payrollOvertimeMultiplier")}
                />
              </div>
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Regular pay = paid hours × hourly rate, capped at paid duty
                hours per shift. Overtime starts after paid duty + unpaid break
                hours.
              </p>
            </Section>
            <Section
              compact
              title="Government contribution amounts per cutoff"
              description="Global amounts applied to every employee when payroll is generated. Admin-entered values are used as-is; the system does not calculate statutory rates."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  name="payrollSssEmployeeShare"
                  label="SSS employee share (₱)"
                  value={initialValues.payrollSssEmployeeShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollSssEmployeeShare")}
                />
                <Field
                  name="payrollSssEmployerShare"
                  label="SSS employer share (₱)"
                  value={initialValues.payrollSssEmployerShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollSssEmployerShare")}
                />
                <Field
                  name="payrollPhilhealthEmployeeShare"
                  label="PhilHealth employee share (₱)"
                  value={initialValues.payrollPhilhealthEmployeeShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollPhilhealthEmployeeShare")}
                />
                <Field
                  name="payrollPhilhealthEmployerShare"
                  label="PhilHealth employer share (₱)"
                  value={initialValues.payrollPhilhealthEmployerShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollPhilhealthEmployerShare")}
                />
                <Field
                  name="payrollPagibigEmployeeShare"
                  label="Pag-IBIG employee share (₱)"
                  value={initialValues.payrollPagibigEmployeeShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollPagibigEmployeeShare")}
                />
                <Field
                  name="payrollPagibigEmployerShare"
                  label="Pag-IBIG employer share (₱)"
                  value={initialValues.payrollPagibigEmployerShare}
                  type="number"
                  min={0}
                  step={0.01}
                  error={errorFor("payrollPagibigEmployerShare")}
                />
                <Field
                  name="payrollMealsDeduction"
                  label="Meals deduction (₱ per cutoff)"
                  value={initialValues.payrollMealsDeduction}
                  type="number"
                  min={0}
                  step={0.01}
                  hint="Applied as an employee deduction to each generated payroll record. Set 0 to disable."
                  error={errorFor("payrollMealsDeduction")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Payroll drafts keep their saved contribution amounts. Save the
                settings, then calculate an open cutoff again to apply changes.
                Closed cutoffs remain unchanged.
              </p>
            </Section>
          </div>
        </div>

        <div hidden={activeTab !== "receipt"}>
          <Section
            compact
            title="Receipt and Wi-Fi"
            description="One digital receipt template is used for customer receipts throughout the app."
          >
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextAreaField
                    name="receiptHeader"
                    label="Receipt header"
                    value={initialValues.receiptHeader}
                    controlledValue={receiptHeader}
                    onValueChange={setReceiptHeader}
                    error={errorFor("receiptHeader")}
                  />
                  <TextAreaField
                    name="receiptFooter"
                    label="Receipt footer"
                    value={initialValues.receiptFooter}
                    controlledValue={receiptFooter}
                    onValueChange={setReceiptFooter}
                    error={errorFor("receiptFooter")}
                  />
                  <Field
                    name="wifiSsid"
                    label="Wi-Fi name (SSID)"
                    value={initialValues.wifiSsid}
                    controlledValue={wifiSsid}
                    onValueChange={setWifiSsid}
                    error={errorFor("wifiSsid")}
                  />
                  <Field
                    name="wifiPassword"
                    label="Wi-Fi password"
                    value=""
                    controlledValue={wifiPassword}
                    onValueChange={setWifiPassword}
                    type="password"
                    error={errorFor("wifiPassword")}
                    hint={
                      hasWifiPassword
                        ? "A password is saved. Leave this blank to keep it unchanged."
                        : "Leave blank if there is no Wi-Fi password."
                    }
                  />
                  {hasWifiPassword ? (
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        name="removeWifiPassword"
                        className="size-4 accent-amber-600"
                      />
                      Remove saved password
                    </label>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                  <Toggle
                    compact
                    name="printReceiptAuto"
                    label="Auto-print on supported POS printer"
                    description="In a browser, print only after clicking Print receipt."
                    checked={initialValues.printReceiptAuto}
                  />
                  <Toggle
                    compact
                    name="printKotAuto"
                    label="Print kitchen ticket"
                    description="Send KOT when accepted."
                    checked={initialValues.printKotAuto}
                  />
                  <Toggle
                    compact
                    name="showWifiOnReceipt"
                    label="Show Wi-Fi"
                    description="Include access details."
                    checked={initialValues.showWifiOnReceipt}
                    onCheckedChange={setShowWifiOnReceipt}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Digital receipt sample
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Open a live sample preview.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={() => setReceiptPreviewOpen(true)}
                >
                  <Eye className="size-4" aria-hidden="true" /> View sample
                </Button>
              </div>
            </div>
          </Section>
        </div>

        <div hidden={activeTab !== "payments"}>
          <Section
            title="Available payment methods"
            description="Choose which payment options staff can select when creating a new order."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                name="paymentCashEnabled"
                label="Cash"
                description="Accept cash payments."
                checked={initialValues.paymentCashEnabled}
              />
              <Toggle
                name="paymentGcashEnabled"
                label="GCash"
                description="Accept GCash payments. QR image is optional."
                checked={initialValues.paymentGcashEnabled}
              />
              <Toggle
                name="paymentMayaEnabled"
                label="Maya"
                description="Accept Maya payments. QR image is optional."
                checked={initialValues.paymentMayaEnabled}
              />
              <Toggle
                name="paymentQrphEnabled"
                label="QRPH"
                description="Accept QRPH payments."
                checked={initialValues.paymentQrphEnabled}
              />
            </div>
          </Section>
          <Section
            title="Payment QR images"
            description="Optional GCash, Maya, and QRPH images displayed by the POS. These images do not control which payment methods are available. Maximum size: 300 KB per image."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  {
                    kind: "gcash",
                    label: "GCash QR image",
                    exists: hasGcashQr,
                    name: "gcashQrImage",
                    removeName: "removeGcashQrImage",
                  },
                  {
                    kind: "maya",
                    label: "Maya QR image",
                    exists: hasMayaQr,
                    name: "mayaQrImage",
                    removeName: "removeMayaQrImage",
                  },
                  {
                    kind: "qrph",
                    label: "QRPH QR image",
                    exists: hasQrphQr,
                    name: "qrphQrImage",
                    removeName: "removeQrphQrImage",
                  },
                ] as const
              ).map(({ kind, label, exists, removeName }) => (
                <div key={kind} className="space-y-3 rounded-lg border p-4">
                  <div>
                    <label
                      htmlFor={`setting-${kind}-qr`}
                      className="text-sm font-medium"
                    >
                      {label}
                    </label>
                    <Input
                      id={`setting-${kind}-qr`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="mt-2 file:mr-3"
                      onChange={(event) =>
                        readQrImage(kind, event.target.files?.[0])
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {qrImages[kind]
                        ? "A new image will be saved."
                        : exists
                          ? "A QR image is saved."
                          : "No image saved yet."}
                    </p>
                  </div>
                  {exists ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={removeName}
                        className="size-4 accent-amber-600"
                      />
                      Remove saved QR image
                    </label>
                  ) : null}
                </div>
              ))}
            </div>
            {errorFor("gcashQrImage") ||
            errorFor("mayaQrImage") ||
            errorFor("qrphQrImage") ? (
              <p role="alert" className="text-sm text-destructive">
                {errorFor("gcashQrImage") ??
                  errorFor("mayaQrImage") ??
                  errorFor("qrphQrImage")}
              </p>
            ) : null}
          </Section>
        </div>

        <div className="flex justify-end border-t pt-5">
          <Button type="submit" disabled={pending} className="gap-2">
            <Save className="size-4" aria-hidden="true" />
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
      {receiptPreviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setReceiptPreviewOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-preview-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-4 shadow-xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="receipt-preview-title" className="font-semibold">
                  Digital receipt sample
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live preview of the current receipt and Wi-Fi settings.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close receipt preview"
                onClick={() => setReceiptPreviewOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 sm:p-5">
              <ReceiptTemplate
                preview
                settings={{
                  restaurantName: initialValues.restaurantName,
                  branchName: initialValues.branchName,
                  contactNumber: initialValues.contactNumber,
                  email: initialValues.email,
                  address: initialValues.address,
                  tinNumber: initialValues.tinNumber,
                  birMin: initialValues.birMin,
                  currencySymbol: initialValues.currencySymbol,
                  currencyCode: initialValues.currencyCode,
                  vatEnabled: initialValues.vatEnabled,
                  vatRate: Number(initialValues.vatRate),
                  vatInclusive: initialValues.vatInclusive,
                  serviceChargeEnabled: initialValues.serviceChargeEnabled,
                  serviceChargeRate: Number(initialValues.serviceChargeRate),
                  receiptHeader,
                  receiptFooter,
                  wifiSsid,
                  wifiPassword:
                    wifiPassword || (hasWifiPassword ? "••••••••" : ""),
                  showWifiOnReceipt,
                }}
              />
            </div>
          </section>
        </div>
      ) : null}
      <div hidden={activeTab !== "branches"}>
        <BranchManagement branches={branches} />
      </div>
    </div>
  )
}
