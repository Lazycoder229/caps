export type ReceiptTemplateSettings = {
  restaurantName: string
  branchName: string
  contactNumber: string
  email: string
  address: string
  tinNumber: string | null
  birMin: string | null
  currencySymbol: string
  currencyCode: string
  vatEnabled: boolean
  vatRate: number
  vatInclusive: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  receiptHeader: string | null
  receiptFooter: string | null
  wifiSsid: string | null
  wifiPassword?: string
  showWifiOnReceipt: boolean
}

export type ReceiptLineItem = {
  name: string
  quantity: number
  unitPrice: number
}
export type ReceiptData = {
  receiptNumber: string
  date: Date
  items: ReceiptLineItem[]
  paymentMethod: string
  cashier: string
  totals?: {
    subtotal: number
    discount: number
    tax: number
    serviceCharge: number
    total: number
  }
}

const sampleReceipt: ReceiptData = {
  receiptNumber: "SAMPLE-0001",
  date: new Date("2026-10-12T12:30:00"),
  items: [
    { name: "Roast Chicken Meal", quantity: 1, unitPrice: 249 },
    { name: "Iced Tea", quantity: 2, unitPrice: 45 },
  ],
  paymentMethod: "Cash",
  cashier: "Sample Cashier",
}

function money(amount: number, settings: ReceiptTemplateSettings) {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: settings.currencyCode || "PHP",
    }).format(amount)
  } catch {
    return `${settings.currencySymbol || "₱"}${amount.toFixed(2)}`
  }
}

function Lines({ value }: { value: string | null }) {
  if (!value?.trim()) return null
  return <div className="whitespace-pre-wrap">{value}</div>
}

export function ReceiptTemplate({
  settings,
  receipt = sampleReceipt,
  preview = false,
  embedded = false,
}: {
  settings: ReceiptTemplateSettings
  receipt?: ReceiptData
  preview?: boolean
  /** Receipt is placed directly inside a dialog or other framed container. */
  embedded?: boolean
}) {
  const calculatedSubtotal = receipt.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const calculatedServiceCharge = settings.serviceChargeEnabled
    ? (calculatedSubtotal * Number(settings.serviceChargeRate || 0)) / 100
    : 0
  const vat =
    settings.vatEnabled && !settings.vatInclusive
      ? (calculatedSubtotal * Number(settings.vatRate || 0)) / 100
      : 0
  const subtotal = receipt.totals?.subtotal ?? calculatedSubtotal
  const serviceCharge = receipt.totals?.serviceCharge ?? calculatedServiceCharge
  const total =
    receipt.totals?.total ?? calculatedSubtotal + calculatedServiceCharge + vat
  const discount = receipt.totals?.discount ?? 0
  const displayedVat = receipt.totals?.tax ?? vat
  const dateText = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(receipt.date)

  return (
    <article
      aria-label={preview ? "Digital receipt sample" : "Customer receipt"}
      className={`${embedded ? "mx-0 w-full max-w-none px-4 py-5 sm:px-6" : "mx-auto w-full max-w-[340px] px-6 py-7 shadow-lg ring-1 ring-black/5"} bg-white font-mono text-neutral-900 print:max-w-none print:shadow-none print:ring-0 ${preview ? "px-4 py-4 text-[10px] leading-snug" : "text-[12px] leading-relaxed"}`}
    >
      <div className={`text-center ${preview ? "space-y-0.5" : "space-y-1"}`}>
        <Lines value={settings.receiptHeader} />
        <h3
          className={`pt-1 leading-tight font-bold uppercase ${preview ? "text-sm" : "text-base"}`}
        >
          {settings.restaurantName || "Restaurant name"}
        </h3>
        {settings.branchName ? <p>{settings.branchName}</p> : null}
        {settings.address ? (
          <p className="whitespace-pre-wrap">{settings.address}</p>
        ) : null}
        {settings.contactNumber ? <p>{settings.contactNumber}</p> : null}
        {settings.email ? <p className="break-all">{settings.email}</p> : null}
        {settings.tinNumber ? <p>TIN: {settings.tinNumber}</p> : null}
        {settings.birMin ? <p>MIN: {settings.birMin}</p> : null}
      </div>

      <div
        className={`border-y border-dashed border-neutral-400 ${preview ? "my-2 py-1.5" : "my-4 py-3"}`}
      >
        <div className="flex justify-between gap-2">
          <span>Receipt</span>
          <span>{receipt.receiptNumber}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Date</span>
          <span className="text-right">{dateText}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Cashier</span>
          <span>{receipt.cashier}</span>
        </div>
      </div>

      <div className={preview ? "space-y-1" : "space-y-2"}>
        {receipt.items.map((item, index) => (
          <div key={`${item.name}-${index}`}>
            <div>{item.name}</div>
            <div className="flex justify-between gap-2 text-neutral-600">
              <span>
                {item.quantity} × {money(item.unitPrice, settings)}
              </span>
              <span>{money(item.quantity * item.unitPrice, settings)}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`space-y-1 border-t border-dashed border-neutral-400 ${preview ? "my-2 pt-1.5" : "my-4 pt-3"}`}
      >
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(subtotal, settings)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{money(discount, settings)}</span>
          </div>
        ) : null}
        {settings.vatEnabled ? (
          <div className="flex justify-between">
            <span>VAT ({settings.vatRate}%)</span>
            <span>{money(displayedVat, settings)}</span>
          </div>
        ) : null}
        {settings.serviceChargeEnabled ? (
          <div className="flex justify-between">
            <span>Service charge</span>
            <span>{money(serviceCharge, settings)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-neutral-300 pt-2 text-sm font-bold">
          <span>TOTAL</span>
          <span>{money(total, settings)}</span>
        </div>
      </div>

      <div className="flex justify-between">
        <span>Payment</span>
        <span>{receipt.paymentMethod}</span>
      </div>
      {settings.showWifiOnReceipt &&
      (settings.wifiSsid || settings.wifiPassword) ? (
        <div
          className={`border-y border-dashed border-neutral-400 text-center ${preview ? "my-2 py-1.5" : "my-4 py-3"}`}
        >
          <p className="font-bold">FREE WI-FI</p>
          {settings.wifiSsid ? <p>Network: {settings.wifiSsid}</p> : null}
          {settings.wifiPassword ? (
            <p>Password: {settings.wifiPassword}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className={`text-center ${preview ? "mt-2 space-y-1" : "mt-5 space-y-2"}`}
      >
        <Lines value={settings.receiptFooter} />
        <p className="font-bold">Thank you for dining with us!</p>
      </div>
      {preview ? (
        <p className="mt-2 border-t border-dashed border-neutral-300 pt-1 text-center text-[9px] text-neutral-500">
          DIGITAL RECEIPT PREVIEW · SAMPLE ORDER
        </p>
      ) : null}
    </article>
  )
}
