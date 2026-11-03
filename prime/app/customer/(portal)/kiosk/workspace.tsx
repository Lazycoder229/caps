"use client"

import Link from "next/link"
import QRCode from "qrcode"
import { useEffect, useMemo, useState, useTransition } from "react"
import { Minus, Plus, Search, ShoppingBag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ReceiptTemplate,
  type ReceiptData,
  type ReceiptTemplateSettings,
} from "@/components/receipt/receipt-template"
import { createCustomerOrder } from "@/app/customer/actions"
import type {
  KioskMenuItem,
  KioskDiscount,
  KioskPaymentMethod,
  KioskPromotion,
  KioskTable,
} from "./types"

type CartLine = { menuItemId: string; quantity: number; notes: string }
type Pricing = {
  vatEnabled: boolean
  vatRate: number
  vatInclusive: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  requireTableSelection: boolean
}
type OrderResult = {
  orderNumber: string
  paymentReferenceToken: string
  guestOrder: boolean
  receipt: Omit<ReceiptData, "date"> & { date: string }
}

export function CustomerKiosk({
  menu,
  isAuthenticated,
  initialTableId,
  categories,
  tables,
  promotions,
  discounts,
  paymentMethods,
  pricing,
  currencyCode,
  currencySymbol,
  receiptSettings,
}: {
  menu: KioskMenuItem[]
  isAuthenticated: boolean
  initialTableId: string | null
  categories: string[]
  tables: KioskTable[]
  promotions: KioskPromotion[]
  discounts: KioskDiscount[]
  paymentMethods: KioskPaymentMethod[]
  pricing: Pricing
  currencyCode: string
  currencySymbol: string
  receiptSettings: ReceiptTemplateSettings
}) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [orderType, setOrderType] = useState<"counter" | "qr">(
    initialTableId ? "qr" : "counter"
  )
  const [tableId, setTableId] = useState(initialTableId ?? "")
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethods[0]?.id ?? ""
  )
  const [promotionId, setPromotionId] = useState("")
  const [discountTypeId, setDiscountTypeId] = useState("")
  const [discountHolderName, setDiscountHolderName] = useState("")
  const [discountIdNumber, setDiscountIdNumber] = useState("")
  const [message, setMessage] = useState("")
  const [createdOrder, setCreatedOrder] = useState<OrderResult | null>(null)
  const [referenceQr, setReferenceQr] = useState("")
  const [showCart, setShowCart] = useState(false)
  const [pending, startTransition] = useTransition()

  const filteredMenu = useMemo(() => {
    const text = search.trim().toLowerCase()
    return menu.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!text ||
          `${item.name} ${item.description ?? ""}`.toLowerCase().includes(text))
    )
  }, [menu, category, search])
  const draftSubtotal = cart.reduce(
    (sum, line) =>
      sum +
      (menu.find((item) => item.id === line.menuItemId)?.price ?? 0) *
        line.quantity,
    0
  )
  const selectedPromotion = promotions.find((item) => item.id === promotionId)
  const selectedDiscount = discounts.find((item) => item.id === discountTypeId)
  const discountAmount = selectedDiscount
    ? Math.min(
        draftSubtotal,
        Math.round(
          ((draftSubtotal * selectedDiscount.percentage) / 100) * 100
        ) / 100
      )
    : 0
  const promotionEligibleSubtotal = selectedPromotion?.menuItemIds.length
    ? cart
        .filter((line) =>
          selectedPromotion.menuItemIds.includes(line.menuItemId)
        )
        .reduce(
          (sum, line) =>
            sum +
            (menu.find((item) => item.id === line.menuItemId)?.price ?? 0) *
              line.quantity,
          0
        )
    : draftSubtotal
  const promotionBase = Math.max(
    0,
    promotionEligibleSubtotal - discountAmount
  )
  const promotionDiscount = selectedPromotion
    ? Math.min(
        promotionBase,
        selectedPromotion.promoType === "percentage"
          ? (promotionBase * selectedPromotion.discountValue) / 100
          : selectedPromotion.discountValue
      )
    : 0
  const totalDiscount = discountAmount + promotionDiscount
  const subtotal = Math.max(0, draftSubtotal - totalDiscount)
  const tax = pricing.vatEnabled
    ? subtotal *
      (pricing.vatInclusive
        ? pricing.vatRate / (100 + pricing.vatRate)
        : pricing.vatRate / 100)
    : 0
  const serviceCharge = pricing.serviceChargeEnabled
    ? (subtotal * pricing.serviceChargeRate) / 100
    : 0
  const total =
    subtotal +
    serviceCharge +
    (pricing.vatEnabled && pricing.vatInclusive ? 0 : tax)
  const selectedMethod = paymentMethods.find(
    (item) => item.id === paymentMethod
  )

  useEffect(() => {
    if (!createdOrder || selectedMethod?.id === "cash") {
      setReferenceQr("")
      return
    }
    const url = `${window.location.origin}/customer/payment-reference/${createdOrder.paymentReferenceToken}`
    void QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setReferenceQr)
  }, [createdOrder, selectedMethod?.id])

  useEffect(() => {
    if (!isAuthenticated) return
    const savedCart = sessionStorage.getItem("prime-customer-kiosk-cart")
    if (!savedCart) return
    sessionStorage.removeItem("prime-customer-kiosk-cart")
    try {
      const parsed = JSON.parse(savedCart) as CartLine[]
      const validLines = parsed.filter(
        (line) =>
          menu.some((item) => item.id === line.menuItemId) &&
          Number.isInteger(line.quantity) &&
          line.quantity > 0 &&
          line.quantity <= 99
      )
      if (validLines.length) setCart(validLines)
    } catch {
      sessionStorage.removeItem("prime-customer-kiosk-cart")
    }
  }, [isAuthenticated, menu])

  function setQuantity(menuItemId: string, delta: number) {
    setCart((current) => {
      const existing = current.find((line) => line.menuItemId === menuItemId)
      if (!existing && delta > 0)
        return [...current, { menuItemId, quantity: 1, notes: "" }]
      return current
        .map((line) =>
          line.menuItemId === menuItemId
            ? {
                ...line,
                quantity: Math.max(0, Math.min(99, line.quantity + delta)),
              }
            : line
        )
        .filter((line) => line.quantity > 0)
    })
  }

  function preserveCartBeforeAuthentication() {
    if (cart.length)
      sessionStorage.setItem("prime-customer-kiosk-cart", JSON.stringify(cart))
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    if (!cart.length) {
      setMessage("Add at least one menu item.")
      return
    }
    if (!paymentMethod) {
      setMessage(
        "No payment methods are available. Please contact the restaurant."
      )
      return
    }
    if (orderType === "qr" && pricing.requireTableSelection && !tableId) {
      setMessage("Choose a table for dine-in.")
      return
    }
    const formData = new FormData(event.currentTarget)
    formData.set(
      "lines",
      JSON.stringify(
        cart.map(({ menuItemId, quantity, notes }) => ({
          menuItemId,
          quantity,
          notes: notes || null,
        }))
      )
    )
    formData.set("discountTypeId", discountTypeId)
    formData.set("discountHolderName", discountHolderName)
    formData.set("discountIdNumber", discountIdNumber)
    startTransition(async () => {
      const result = await createCustomerOrder(formData)
      if (!result.ok || !("orderNumber" in result)) {
        setMessage(result.message)
        return
      }
      setCreatedOrder({
        orderNumber: result.orderNumber!,
        paymentReferenceToken: result.paymentReferenceToken!,
        guestOrder: result.guestOrder,
        receipt: {
          ...result.receipt,
          date: result.receipt.date,
          paymentMethod: selectedMethod?.label ?? result.receipt.paymentMethod,
        },
      })
      setCart([])
    })
  }

  const formatMoney = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currencyCode,
      }).format(amount)
    } catch {
      return `${currencySymbol}${amount.toFixed(2)}`
    }
  }
  const selectedQty = (id: string) =>
    cart.find((line) => line.menuItemId === id)?.quantity ?? 0
  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const scannedTable = tables.find((table) => table.id === initialTableId)
  const scannedTableAvailable =
    !initialTableId ||
    Boolean(
      scannedTable && ["available", "occupied"].includes(scannedTable.status)
    )
  const availableTables = tables.filter((table) => table.status === "available")
  const returnTo = initialTableId
    ? `/customer/kiosk?tableId=${encodeURIComponent(initialTableId)}`
    : "/customer/kiosk"
  const signInHref = `/customer/login?returnTo=${encodeURIComponent(returnTo)}`
  const registerHref = `/customer/register?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <main className="space-y-5 pb-24 xl:grid xl:h-[calc(100dvh-6rem)] xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden xl:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">ORDER KIOSK</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {initialTableId
              ? `Menu · Table ${scannedTable?.tableNumber ?? "QR"}`
              : "What would you like today?"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialTableId
              ? "Browse the menu and add your favorites to the cart."
              : "Browse the menu, add items to your cart, and choose pickup or dine-in at checkout."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="hidden sm:inline-flex xl:hidden"
            onClick={() => setShowCart(true)}
          >
            <ShoppingBag className="size-4" />
            Cart {cartItemCount ? `(${cartItemCount})` : ""}
          </Button>
        </div>
        <div className="w-full">
          {!isAuthenticated ? (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">
                Guest checkout is available.{" "}
              </span>
              <Link
                onClick={preserveCartBeforeAuthentication}
                className="font-medium text-primary underline underline-offset-4"
                href={signInHref}
              >
                Sign in
              </Link>
              <span className="text-muted-foreground"> or </span>
              <Link
                onClick={preserveCartBeforeAuthentication}
                className="font-medium text-primary underline underline-offset-4"
                href={registerHref}
              >
                create an account
              </Link>
              <span className="text-muted-foreground">
                {" "}
                to save orders and earn points.
              </span>
            </p>
          ) : null}
          {initialTableId && !scannedTableAvailable ? (
            <p
              role="status"
              className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800"
            >
              This table QR is unavailable right now. Please ask a staff member
              for help.
            </p>
          ) : null}
        </div>
      </header>
      {createdOrder ? (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-created-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border bg-background p-4 text-center shadow-xl sm:p-6"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-700">
              ✓
            </div>
            <h2 id="order-created-title" className="mt-3 text-xl font-semibold">
              Order received
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {createdOrder.orderNumber} · Payment is pending verification.
            </p>
            {createdOrder.guestOrder ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-900">
                Save a screenshot of this order confirmation before closing.
                Guest orders and receipts are not saved to an account.
              </p>
            ) : null}
            {createdOrder.guestOrder ? (
              <div className="mt-4 overflow-hidden rounded-xl border text-left">
                <div className="border-b bg-muted/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order confirmation · Payment pending
                </div>
                <ReceiptTemplate
                  embedded
                  settings={receiptSettings}
                  receipt={{
                    ...createdOrder.receipt,
                    date: new Date(createdOrder.receipt.date),
                  }}
                />
              </div>
            ) : null}
            {selectedMethod?.qrImage ? (
              <div className="mt-4 rounded-xl border p-3">
                <p className="mb-2 text-sm font-medium">
                  Pay using {selectedMethod.label}
                </p>
                <img
                  src={selectedMethod.qrImage}
                  alt={`${selectedMethod.label} payment QR`}
                  className="mx-auto size-44 object-contain"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  After paying, submit the transaction reference below.
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                Pay cash at the counter. Your order remains queued until staff
                confirms payment.
              </p>
            )}
            {selectedMethod && selectedMethod.id !== "cash" ? (
              <div className="mt-4 rounded-xl border p-3">
                <p className="text-sm font-medium">Submit payment reference</p>
                {referenceQr ? (
                  <img
                    src={referenceQr}
                    alt="QR link to submit your payment reference"
                    className="mx-auto my-2 size-44"
                  />
                ) : (
                  <div className="mx-auto my-2 size-44 animate-pulse rounded bg-muted" />
                )}
                <Link
                  href={`/customer/payment-reference/${createdOrder.paymentReferenceToken}`}
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Open reference form
                </Link>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {!createdOrder.guestOrder ? (
                <Button asChild variant="outline">
                  <Link href="/customer/orders">View order</Link>
                </Button>
              ) : null}
              <Button onClick={() => setCreatedOrder(null)}>Done</Button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="grid min-h-0 gap-4 xl:h-full xl:grid-cols-[minmax(0,2fr)_minmax(220px,0.7fr)_minmax(280px,0.9fr)]">
        <section className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden">
          <div className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
            <label className="relative block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Search menu"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm"
                placeholder="Search menu"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${category === item ? "bg-primary text-primary-foreground" : "border bg-background hover:bg-muted"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
            {filteredMenu.length ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredMenu.map((item) => (
                  <Card
                    key={item.id}
                    size="sm"
                    className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex h-full flex-col p-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="aspect-[4/3] w-full bg-muted object-cover"
                        />
                      ) : (
                        <div className="grid aspect-[4/3] w-full place-items-center bg-muted text-sm text-muted-foreground">
                          {item.category}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col p-3">
                        <p className="leading-snug font-semibold">
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                          <span className="text-base font-semibold tabular-nums">
                            {formatMoney(item.price)}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedQty(item.id) ? (
                              <>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label={`Remove one ${item.name}`}
                                  onClick={() => setQuantity(item.id, -1)}
                                >
                                  <Minus />
                                </Button>
                                <span className="w-6 text-center text-sm tabular-nums">
                                  {selectedQty(item.id)}
                                </span>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label={`Add one ${item.name}`}
                                  onClick={() => setQuantity(item.id, 1)}
                                >
                                  <Plus />
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setQuantity(item.id, 1)}
                              >
                                <Plus className="size-4" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  No available menu items match your search.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <div
          role={showCart ? "dialog" : undefined}
          aria-modal={showCart ? true : undefined}
          aria-labelledby={showCart ? "customer-cart-title" : undefined}
          className={`${showCart ? "fixed inset-0 z-[90] flex items-end justify-center bg-black/45 sm:items-center sm:p-4 xl:hidden" : "hidden xl:contents"}`}
          onClick={() => setShowCart(false)}
        >
          <form
            onSubmit={submitOrder}
            onClick={(event) => event.stopPropagation()}
            className={`${showCart ? "grid h-[min(92dvh,800px)] max-h-[92dvh] min-h-[70dvh] w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-2xl border bg-background shadow-2xl sm:max-h-[min(90dvh,760px)] sm:max-w-lg sm:rounded-2xl" : "hidden xl:col-span-2 xl:grid xl:h-full xl:min-h-0 xl:grid-cols-[minmax(240px,0.82fr)_minmax(300px,1fr)] xl:overflow-hidden xl:rounded-2xl xl:border xl:bg-background xl:shadow-sm"}`}
          >
            <input type="hidden" name="orderType" value={orderType} />
            <input
              type="hidden"
              name="tableId"
              value={orderType === "qr" ? tableId : ""}
            />
            <input type="hidden" name="promotionId" value={promotionId} />
            <input type="hidden" name="discountTypeId" value={discountTypeId} />
            <input type="hidden" name="discountHolderName" value={discountHolderName} />
            <input type="hidden" name="discountIdNumber" value={discountIdNumber} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
            <input
              type="hidden"
              name="lines"
              value={JSON.stringify(
                cart.map(({ menuItemId, quantity, notes }) => ({
                  menuItemId,
                  quantity,
                  notes: notes || null,
                }))
              )}
            />
            <div className="flex items-center justify-between border-b px-4 py-3 xl:hidden">
              <div>
                <h2 id="customer-cart-title" className="font-semibold">
                  Your cart
                </h2>
                <p className="text-xs text-muted-foreground">
                  {cartItemCount} item{cartItemCount === 1 ? "" : "s"}
                </p>
              </div>
              {showCart ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                >
                  <X />
                </Button>
              ) : (
                <ShoppingBag className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain xl:contents">
              <section className="grid min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden xl:border-r">
                <div className="hidden items-center justify-between border-b px-4 py-3 xl:flex">
                  <div>
                    <h2 className="font-semibold">Current order</h2>
                    <p className="text-xs text-muted-foreground">
                      {cartItemCount} item{cartItemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ShoppingBag className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-4 overflow-y-auto overscroll-contain p-4">
                  {cart.length ? (
                    cart.map((line) => {
                      const item = menu.find(
                        (entry) => entry.id === line.menuItemId
                      )
                      if (!item) return null
                      return (
                        <div
                          key={line.menuItemId}
                          className="space-y-2 border-b pb-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {line.quantity} × {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(item.price * line.quantity)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove ${item.name}`}
                              onClick={() =>
                                setQuantity(item.id, -line.quantity)
                              }
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                          <input
                            value={line.notes}
                            onChange={(event) =>
                              setCart((current) =>
                                current.map((entry) =>
                                  entry.menuItemId === line.menuItemId
                                    ? { ...entry, notes: event.target.value }
                                    : entry
                                )
                              )
                            }
                            maxLength={255}
                            placeholder="Special request (optional)"
                            className="h-8 w-full rounded border bg-background px-2 text-xs"
                          />
                        </div>
                      )
                    })
                  ) : (
                    <div className="grid min-h-32 place-items-center text-center text-sm text-muted-foreground">
                      Your cart is empty.
                      <br />
                      Add something delicious.
                    </div>
                  )}
                </div>
              </section>

              <section className="min-h-0 xl:grid xl:grid-rows-[auto_minmax(0,1fr)_auto] xl:overflow-hidden">
                <div className="hidden border-b px-4 py-3 xl:block">
                  <h2 className="font-semibold">Checkout summary</h2>
                </div>
                <div className="space-y-4 p-4 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain">
                  {!isAuthenticated ? (
                    <fieldset className="grid gap-2 rounded-lg border p-3">
                      <legend className="px-1 text-xs font-semibold tracking-wide text-muted-foreground">
                        GUEST CHECKOUT
                      </legend>
                      <label className="grid gap-1 text-xs font-medium">
                        Name
                        <input
                          name="guestName"
                          autoComplete="name"
                          required
                          minLength={2}
                          maxLength={100}
                          placeholder="Name for your order"
                          className="h-10 rounded-md border bg-background px-3 text-sm font-normal"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-medium">
                        Mobile number{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                        <input
                          name="guestContactNumber"
                          type="tel"
                          autoComplete="tel"
                          maxLength={20}
                          placeholder="09XX XXX XXXX"
                          className="h-10 rounded-md border bg-background px-3 text-sm font-normal"
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">
                        No account needed. Sign in only if you want to save
                        order history and points.
                      </p>
                    </fieldset>
                  ) : null}
                  {initialTableId ? (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                        DINE-IN · TABLE {scannedTable?.tableNumber ?? "QR"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Table selected from the scanned QR code.
                      </p>
                    </div>
                  ) : (
                    <fieldset className="grid gap-2">
                      <legend className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground">
                        ORDER TYPE
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        <Choice
                          selected={orderType === "counter"}
                          onClick={() => {
                            setOrderType("counter")
                            setTableId("")
                          }}
                        >
                          Pickup
                        </Choice>
                        <Choice
                          selected={orderType === "qr"}
                          onClick={() => setOrderType("qr")}
                        >
                          Dine-in
                        </Choice>
                      </div>
                    </fieldset>
                  )}
                  {orderType === "qr" && !initialTableId ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                      TABLE
                      <select
                        value={tableId}
                        onChange={(event) => setTableId(event.target.value)}
                        required={pricing.requireTableSelection}
                        className="h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground"
                      >
                        <option value="">
                          {pricing.requireTableSelection
                            ? "Choose available table"
                            : "No table selected"}
                        </option>
                        {availableTables.map((table) => (
                          <option key={table.id} value={table.id}>
                            Table {table.tableNumber} · seats {table.capacity}
                          </option>
                        ))}
                      </select>
                      {!availableTables.length &&
                      pricing.requireTableSelection ? (
                        <span className="font-normal text-amber-700">
                          No tables are available right now.
                        </span>
                      ) : null}
                    </label>
                  ) : null}
                  {promotions.length ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                      PROMOTION
                      <select
                        value={promotionId}
                        onChange={(event) => setPromotionId(event.target.value)}
                        className="h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground"
                      >
                        <option value="">No promotion</option>
                        {promotions.map((promo) => (
                          <option
                            key={promo.id}
                            value={promo.id}
                            disabled={
                              (promo.minSpend !== null &&
                                draftSubtotal < promo.minSpend) ||
                              (promo.menuItemIds.length > 0 &&
                                !cart.some((line) =>
                                  promo.menuItemIds.includes(line.menuItemId)
                                ))
                            }
                          >
                            {promo.name}
                            {promo.promoType === "percentage"
                              ? ` · ${promo.discountValue}% off`
                              : ` · ${currencySymbol}${promo.discountValue.toFixed(2)} off`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {discounts.length ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                      DISCOUNT
                      <select
                        value={discountTypeId}
                        onChange={(event) => {
                          setDiscountTypeId(event.target.value)
                          setDiscountHolderName("")
                          setDiscountIdNumber("")
                        }}
                        className="h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground"
                      >
                        <option value="">No discount</option>
                        {discounts.map((discount) => (
                          <option key={discount.id} value={discount.id}>
                            {discount.name} · {discount.percentage}% off
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {selectedDiscount ? (
                    <div className="space-y-3 rounded-lg border p-3">
                      <label className="grid gap-1 text-xs font-medium">
                        Discount holder name
                        <input
                          value={discountHolderName}
                          onChange={(event) => setDiscountHolderName(event.target.value)}
                          maxLength={100}
                          required
                          className="h-10 rounded-md border bg-background px-3 text-sm font-normal"
                          placeholder="Name on the discount ID"
                        />
                      </label>
                      {selectedDiscount.requiresIdVerification ? (
                        <label className="grid gap-1 text-xs font-medium">
                          Discount ID number
                          <input
                            value={discountIdNumber}
                            onChange={(event) => setDiscountIdNumber(event.target.value)}
                            maxLength={50}
                            required
                            className="h-10 rounded-md border bg-background px-3 text-sm font-normal"
                            placeholder="Enter the ID number"
                          />
                        </label>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Staff will verify the discount and ID before confirming payment.
                      </p>
                    </div>
                  ) : null}
                  <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                    PAYMENT METHOD
                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value as KioskPaymentMethod["id"]
                        )
                      }
                      required
                      className="h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedMethod?.qrImage ? (
                    <div className="rounded-lg border p-3 text-center">
                      <p className="mb-1 text-xs font-medium">
                        Scan to pay using {selectedMethod.label}
                      </p>
                      <img
                        src={selectedMethod.qrImage}
                        alt={`${selectedMethod.label} payment QR`}
                        className="mx-auto size-36 object-contain"
                      />
                    </div>
                  ) : null}
                  {!paymentMethods.length ? (
                    <p className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-900">
                      Online checkout is temporarily unavailable. Please ask
                      staff to configure a payment method.
                    </p>
                  ) : null}
                </div>
                <div className="sticky bottom-0 space-y-2 border-t bg-background p-4 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] xl:static xl:shadow-none">
                  <Line label="Subtotal" value={formatMoney(draftSubtotal)} />
                  {discountAmount > 0 ? (
                    <Line
                      label={selectedDiscount?.name ?? "Discount"}
                      value={`−${formatMoney(discountAmount)}`}
                    />
                  ) : null}
                  {promotionDiscount > 0 ? (
                    <Line
                      label="Promotion"
                      value={`−${formatMoney(promotionDiscount)}`}
                    />
                  ) : null}
                  {pricing.vatEnabled ? (
                    <Line
                      label={`VAT ${pricing.vatInclusive ? "(included)" : ""}`}
                      value={formatMoney(tax)}
                    />
                  ) : null}
                  {pricing.serviceChargeEnabled ? (
                    <Line
                      label="Service charge"
                      value={formatMoney(serviceCharge)}
                    />
                  ) : null}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                  {message ? (
                    <p role="alert" className="text-sm text-destructive">
                      {message}
                    </p>
                  ) : null}
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={
                      pending ||
                      !cart.length ||
                      !paymentMethods.length ||
                      !scannedTableAvailable ||
                      (orderType === "qr" &&
                        pricing.requireTableSelection &&
                        (!tableId ||
                          (!availableTables.length && !initialTableId)))
                    }
                  >
                    {pending
                      ? "Placing order…"
                      : isAuthenticated
                        ? "Place order"
                        : "Place guest order"}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Orders stay pending until staff confirms payment.
                  </p>
                </div>
              </section>
            </div>
          </form>
        </div>
      </div>
      {cart.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_28px_rgba(0,0,0,0.08)] backdrop-blur xl:hidden">
          <Button
            type="button"
            className="h-12 w-full justify-between rounded-xl px-4"
            onClick={() => setShowCart(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              View cart{" "}
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                {cartItemCount}
              </span>
            </span>
            <span className="font-semibold">
              {formatMoney(total)} <span aria-hidden="true">→</span>
            </span>
          </Button>
        </div>
      ) : null}
    </main>
  )
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-9 rounded-md border text-sm ${selected ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted"}`}
    >
      {children}
    </button>
  )
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
