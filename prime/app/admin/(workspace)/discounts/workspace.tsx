"use client"

import { useMemo, useState } from "react"
import {
  BadgePercent,
  CalendarDays,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDiscounts } from "./hooks/use-discounts"
import type { DiscountTypeRow, MenuOption, PromotionRow } from "./types"
import type { PromoType } from "@/lib/database/entities/entities/enums"

type Tab = "discounts" | "promotions"
type DiscountDraft = (Partial<DiscountTypeRow> & { id: string }) | null
type PromotionDraft = (Partial<PromotionRow> & { id: string }) | null
const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

function todayManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`))
}

export function DiscountsWorkspace({
  discounts,
  promotions,
  menuItems,
  today,
}: {
  discounts: DiscountTypeRow[]
  promotions: PromotionRow[]
  menuItems: MenuOption[]
  today: string
}) {
  const [tab, setTab] = useState<Tab>("discounts")
  const [query, setQuery] = useState("")
  const [discountDraft, setDiscountDraft] = useState<DiscountDraft>(null)
  const [promoDraft, setPromoDraft] = useState<PromotionDraft>(null)
  const {
    pending,
    saveDiscount,
    savePromo,
    toggleDiscount,
    togglePromotion,
    removeDiscount,
    removePromotion,
  } = useDiscounts()
  const filteredDiscounts = useMemo(() => {
    const value = query.trim().toLowerCase()
    return discounts.filter(
      (item) => !value || item.name.toLowerCase().includes(value)
    )
  }, [discounts, query])
  const filteredPromotions = useMemo(() => {
    const value = query.trim().toLowerCase()
    return promotions.filter(
      (item) =>
        !value ||
        [item.name, item.description, ...item.menuItemNames].some((text) =>
          text?.toLowerCase().includes(value)
        )
    )
  }, [promotions, query])
  const activePromotions = promotions.filter(
    (item) =>
      item.isActive &&
      item.startDate <= today &&
      item.endDate >= today &&
      (item.usageLimit === null || item.usageCount < item.usageLimit)
  ).length

  function newDiscount() {
    setDiscountDraft({
      id: "",
      name: "",
      percentage: 20,
      requiresIdVerification: true,
      isActive: true,
      orderCount: 0,
    })
  }
  function newPromotion() {
    setPromoDraft({
      id: "",
      name: "",
      description: "",
      promoType: "percentage",
      discountValue: 10,
      minSpend: null,
      startDate: today,
      endDate: today,
      usageLimit: null,
      usageCount: 0,
      isActive: true,
      menuItemIds: [],
      menuItemNames: [],
      orderCount: 0,
    })
  }

  async function submitDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await saveDiscount(new FormData(event.currentTarget))
    if (result.ok) setDiscountDraft(null)
  }
  async function submitPromo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set(
      "menuItemIds",
      JSON.stringify(
        [
          ...form.querySelectorAll<HTMLInputElement>(
            'input[name="menuItemId"]:checked'
          ),
        ].map((input) => input.value)
      )
    )
    const result = await savePromo(data)
    if (result.ok) setPromoDraft(null)
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discounts &amp; Promos
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage discounts and promotions available at POS checkout.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => (tab === "discounts" ? newDiscount() : newPromotion())}
        >
          <Plus className="mr-1 size-4" />
          {tab === "discounts" ? "New discount" : "New promotion"}
        </Button>
      </header>
      <div className="grid grid-cols-3 gap-3">
        <Summary label="Discount types" value={discounts.length} />
        <Summary
          label="Active discounts"
          value={discounts.filter((item) => item.isActive).length}
        />
        <Summary label="Promotions running today" value={activePromotions} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          className="flex gap-1 rounded-lg border bg-muted/30 p-1"
          aria-label="Discount management sections"
        >
          <TabButton
            active={tab === "discounts"}
            onClick={() => setTab("discounts")}
          >
            <BadgePercent className="size-4" />
            Discount types
          </TabButton>
          <TabButton
            active={tab === "promotions"}
            onClick={() => setTab("promotions")}
          >
            <Tag className="size-4" />
            Promotions
          </TabButton>
        </nav>
        <label className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search discounts and promotions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              tab === "discounts"
                ? "Search discount types..."
                : "Search promotions..."
            }
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>

      {tab === "discounts" ? (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Orders used</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDiscounts.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {item.percentage}%
                    </td>
                    <td className="px-4 py-3">
                      {item.requiresIdVerification
                        ? "ID required"
                        : "No ID required"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {item.orderCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? "secondary" : "outline"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            toggleDiscount(item.id, !item.isActive)
                          }
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => setDiscountDraft(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={pending}
                          aria-label={`Delete ${item.name}`}
                          onClick={() =>
                            void removeDiscount(item.id, item.name)
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredDiscounts.length ? (
                  <tr>
                    <td colSpan={6}>
                      <Empty title="No discount types" onAdd={newDiscount} />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card
          size="sm"
          className="overflow-hidden [--card-spacing:--spacing(0)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Promotion</th>
                  <th className="px-4 py-3 font-medium">Offer</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">Menu items</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPromotions.map((item) => {
                  const scheduled =
                    item.startDate <= today && item.endDate >= today
                  const remaining =
                    item.usageLimit === null
                      ? "Unlimited"
                      : `${item.usageCount} / ${item.usageLimit}`
                  const statusText = !item.isActive
                    ? "Inactive"
                    : item.usageLimit !== null &&
                        item.usageCount >= item.usageLimit
                      ? "Limit reached"
                      : item.endDate < today
                        ? "Expired"
                        : item.startDate > today
                          ? "Scheduled"
                          : "Active"
                  return (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.description ? (
                          <p className="max-w-52 truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {offerLabel(item.promoType, item.discountValue)}
                        {item.minSpend !== null ? (
                          <p className="text-xs text-muted-foreground">
                            Min. spend ₱{item.minSpend.toFixed(2)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5 text-muted-foreground" />
                          {dateLabel(item.startDate)} –{" "}
                          {dateLabel(item.endDate)}
                        </span>
                      </td>
                      <td className="max-w-56 px-4 py-3">
                        <p className="truncate">
                          {item.menuItemNames.length
                            ? item.menuItemNames.join(", ")
                            : "All menu items"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.menuItemNames.length
                            ? `${item.menuItemNames.length} selected`
                            : "No item restriction"}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {remaining}
                        <p className="text-xs text-muted-foreground">
                          {item.orderCount} orders
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.isActive && scheduled ? "secondary" : "outline"
                          }
                        >
                          {statusText}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              pending ||
                              (item.promoType === "buy_x_get_y" &&
                                !item.isActive)
                            }
                            onClick={() =>
                              togglePromotion(item.id, !item.isActive)
                            }
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => setPromoDraft(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={pending}
                            aria-label={`Delete ${item.name}`}
                            onClick={() =>
                              void removePromotion(item.id, item.name)
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filteredPromotions.length ? (
                  <tr>
                    <td colSpan={7}>
                      <Empty title="No promotions" onAdd={newPromotion} />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {discountDraft ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending)
              setDiscountDraft(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="discount-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
          >
            <header className="mb-4 flex justify-between">
              <div>
                <h2 id="discount-title" className="text-lg font-semibold">
                  {discountDraft.id
                    ? "Edit discount type"
                    : "New discount type"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure an eligible checkout discount such as Senior or PWD.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDiscountDraft(null)}
              >
                <X className="size-5" />
              </button>
            </header>
            <form className="space-y-3" onSubmit={submitDiscount}>
              <input type="hidden" name="id" value={discountDraft.id} />
              <Field label="Name">
                <input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={discountDraft.name}
                  placeholder="Senior Citizen"
                  className={inputClass}
                />
              </Field>
              <Field label="Discount percentage">
                <span className="relative">
                  <input
                    name="percentage"
                    type="number"
                    required
                    min="0.01"
                    max="100"
                    step="0.01"
                    defaultValue={discountDraft.percentage}
                    className={`${inputClass} pr-9`}
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </span>
              </Field>
              <BoolField
                name="requiresIdVerification"
                label="Require ID verification"
                defaultChecked={discountDraft.requiresIdVerification ?? true}
              />
              <BoolField
                name="isActive"
                label="Available at checkout"
                defaultChecked={discountDraft.isActive ?? true}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDiscountDraft(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save discount"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {promoDraft ? (
        <PromotionForm
          key={promoDraft.id || "new-promo"}
          draft={promoDraft}
          menuItems={menuItems}
          pending={pending}
          onClose={() => setPromoDraft(null)}
          onSubmit={submitPromo}
        />
      ) : null}
    </main>
  )
}

function PromotionForm({
  draft,
  menuItems,
  pending,
  onClose,
  onSubmit,
}: {
  draft: PromotionDraft & {}
  menuItems: MenuOption[]
  pending: boolean
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  const [type, setType] = useState<PromoType>(draft.promoType ?? "percentage")
  const [selectedItems, setSelectedItems] = useState<string[]>(
    draft.menuItemIds ?? []
  )
  const [menuSearch, setMenuSearch] = useState("")
  const relevantMenu = menuItems.filter((item) =>
    `${item.name} ${item.categoryName}`
      .toLowerCase()
      .includes(menuSearch.toLowerCase())
  )
  const supported = type !== "buy_x_get_y"
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
        aria-labelledby="promotion-title"
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background p-5 shadow-2xl"
      >
        <header className="mb-4 flex justify-between gap-3">
          <div>
            <h2 id="promotion-title" className="text-lg font-semibold">
              {draft.id ? "Edit promotion" : "New promotion"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Set offer rules, dates, limits, and eligible menu items.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </button>
        </header>
        <form className="space-y-3" onSubmit={onSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <input
            type="hidden"
            name="menuItemIds"
            value={JSON.stringify(selectedItems)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Promotion name">
              <input
                name="name"
                required
                maxLength={150}
                defaultValue={draft.name}
                className={inputClass}
                placeholder="Weekday lunch"
              />
            </Field>
            <Field label="Promotion type">
              <select
                name="promoType"
                value={type}
                onChange={(event) => setType(event.target.value as PromoType)}
                className={inputClass}
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed_amount">Fixed amount off</option>
                <option value="buy_x_get_y">
                  Buy X, Get Y (not yet supported)
                </option>
              </select>
            </Field>
            <Field
              label={
                type === "percentage"
                  ? "Discount percentage"
                  : type === "fixed_amount"
                    ? "Discount amount (₱)"
                    : "Placeholder value"
              }
            >
              <input
                name="discountValue"
                type="number"
                required
                min="0.01"
                max={type === "percentage" ? 100 : 1000000}
                step="0.01"
                defaultValue={
                  type === "buy_x_get_y"
                    ? (draft.discountValue ?? 1)
                    : (draft.discountValue ?? 10)
                }
                className={inputClass}
                readOnly={type === "buy_x_get_y"}
              />
            </Field>
            <Field label="Minimum spend (optional)">
              <input
                name="minSpend"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                defaultValue={draft.minSpend ?? ""}
                className={inputClass}
                placeholder="No minimum"
              />
            </Field>
            <Field label="Start date">
              <input
                name="startDate"
                type="date"
                required
                defaultValue={draft.startDate ?? todayManila()}
                className={inputClass}
              />
            </Field>
            <Field label="End date">
              <input
                name="endDate"
                type="date"
                required
                defaultValue={draft.endDate ?? todayManila()}
                className={inputClass}
              />
            </Field>
            <Field label="Usage limit (optional)">
              <input
                name="usageLimit"
                type="number"
                min="1"
                step="1"
                defaultValue={draft.usageLimit ?? ""}
                className={inputClass}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Description (optional)">
              <input
                name="description"
                maxLength={65535}
                defaultValue={draft.description ?? ""}
                className={inputClass}
                placeholder="Short internal or customer-facing details"
              />
            </Field>
          </div>
          <div className="space-y-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Applicable menu items</span>
              <span className="text-xs text-muted-foreground">
                Leave all unchecked to apply to every menu item.
              </span>
              <span className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Find menu item"
                />
              </span>
            </label>
            <div className="max-h-40 overflow-y-auto rounded-md border">
              {relevantMenu.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    name="menuItemId"
                    value={item.id}
                    checked={selectedItems.includes(item.id)}
                    onChange={(event) =>
                      setSelectedItems((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id)
                      )
                    }
                    className="size-4 accent-amber-600"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.categoryName}
                  </span>
                </label>
              ))}
              {relevantMenu.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No menu items match.
                </p>
              ) : null}
            </div>
          </div>
          {type === "buy_x_get_y" ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs text-amber-800">
              This database entity does not have buy/get quantity fields. Save
              it inactive; it will not appear at checkout until the schema
              supports the rule.
            </p>
          ) : null}
          <BoolField
            name="isActive"
            label="Available at checkout"
            defaultChecked={supported && (draft.isActive ?? true)}
            disabled={!supported}
          />
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
              {pending ? "Saving…" : "Save promotion"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function offerLabel(type: PromoType, value: number | null) {
  if (type === "buy_x_get_y") return "Buy X, Get Y"
  if (type === "percentage") return `${Number(value ?? 0)}% off`
  return `₱${Number(value ?? 0).toFixed(2)} off`
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

function BoolField({
  name,
  label,
  defaultChecked,
  disabled = false,
}: {
  name: string
  label: string
  defaultChecked: boolean
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        name={`${name}Toggle`}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="size-4 accent-amber-600"
        onChange={(event) => {
          const hidden = event.currentTarget.form?.elements.namedItem(
            name
          ) as HTMLInputElement | null
          if (hidden) hidden.value = String(event.currentTarget.checked)
        }}
      />
      <input type="hidden" name={name} value={String(defaultChecked)} />
      {label}
    </label>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${active ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm" className="[--card-spacing:--spacing(1)]">
      <CardContent className="flex min-h-0 items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-base font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}

function Empty({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
      <Tag className="size-7 text-muted-foreground" />
      <h2 className="mt-3 font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first record to make it available for checkout.
      </p>
      <Button className="mt-3" size="sm" onClick={onAdd}>
        <Plus className="mr-1 size-4" />
        Add new
      </Button>
    </CardContent>
  )
}
