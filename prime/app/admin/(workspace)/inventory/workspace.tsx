"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  Boxes,
  ClipboardList,
  Clock3,
  Edit3,
  Plus,
  Utensils,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  saveInventoryCategory,
  saveInventoryItem,
  saveMenuCategory,
  saveMenuItem,
  saveMenuRecipe,
  recordMenuUsage,
  recordStockMovement,
  setInventoryItemActive,
  setMenuItemAvailability,
} from "./actions"

type Ingredient = {
  id: string
  name: string
  categoryId: string | null
  categoryName: string | null
  unit: string
  stockQuantity: number
  reorderThreshold: number | null
  unitCost: number | null
  supplier: string | null
  isActive: boolean
}
type Menu = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  stockQuantity: number | null
}
type Category = { id: string; name: string }
type MenuCategory = Category & { isActive: boolean }
type RecipeLine = {
  menuItemId: string
  inventoryItemId: string
  quantityUsed: number
}
type Log = {
  id: string
  itemType: string
  itemName: string
  type: string
  quantityChange: number
  quantityAfter: number | null
  note: string | null
  performedBy: string | null
  createdAt: string
}
type Props = {
  initialTab: string
  menuOnly?: boolean
  ingredients: Ingredient[]
  ingredientCategories: Category[]
  menuItems: Menu[]
  menuCategories: MenuCategory[]
  recipes: RecipeLine[]
  logs: Log[]
}
type Modal = "ingredient" | "menu" | "stock" | null
type Reply = { ok: boolean; message: string }
type FormAction = (data: FormData) => Promise<Reply>

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
const tabs = [
  { id: "overview", label: "Overview", icon: Boxes },
  { id: "ingredients", label: "Ingredients", icon: Archive },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "recipes", label: "Recipes", icon: ClipboardList },
  { id: "movements", label: "Stock history", icon: Clock3 },
] as const
const peso = (amount: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount
  )

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-background p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

export function InventoryWorkspace({
  initialTab,
  menuOnly = false,
  ingredients,
  ingredientCategories,
  menuItems,
  menuCategories,
  recipes,
  logs,
}: Props) {
  const router = useRouter()
  const { toast, confirm } = useAdminFeedback()
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>(
    menuOnly
      ? "menu"
      : tabs.some((item) => item.id === initialTab)
        ? (initialTab as (typeof tabs)[number]["id"])
        : "overview"
  )
  const [modal, setModal] = useState<Modal>(null)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  )
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [moving, setMoving] = useState<{
    itemType: "ingredient" | "menu_item"
    id: string
    name: string
    unit: string
  } | null>(null)
  const [movementType, setMovementType] = useState<
    "stock_in" | "adjustment" | "waste"
  >("stock_in")
  const [busy, setBusy] = useState(false)
  const [ingredientCategory, setIngredientCategory] = useState("")
  const [menuCategory, setMenuCategory] = useState("")
  const [recipeMenuId, setRecipeMenuId] = useState(menuItems[0]?.id ?? "")
  const [recipeLines, setRecipeLines] = useState<
    { inventoryItemId: string; quantityUsed: string }[]
  >([])
  const [usageQuantity, setUsageQuantity] = useState("1")

  const activeIngredients = ingredients.filter((item) => item.isActive)
  const lowStock = activeIngredients.filter(
    (item) =>
      item.reorderThreshold !== null &&
      item.stockQuantity <= item.reorderThreshold
  )
  const stockValue = activeIngredients.reduce(
    (sum, item) => sum + item.stockQuantity * (item.unitCost ?? 0),
    0
  )
  const availableMenu = menuItems.filter((item) => item.isAvailable)
  const savedRecipe = recipes
    .filter((line) => line.menuItemId === recipeMenuId)
    .map((line) => ({
      inventoryItemId: line.inventoryItemId,
      quantityUsed: line.quantityUsed,
    }))
    .sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId))
  const draftRecipe = recipeLines
    .map((line) => ({
      inventoryItemId: line.inventoryItemId,
      quantityUsed: Number(line.quantityUsed),
    }))
    .sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId))
  const recipeIsSaved =
    JSON.stringify(savedRecipe) === JSON.stringify(draftRecipe)

  useEffect(() => {
    setRecipeLines(
      recipes
        .filter((line) => line.menuItemId === recipeMenuId)
        .map((line) => ({
          inventoryItemId: line.inventoryItemId,
          quantityUsed: String(line.quantityUsed),
        }))
    )
  }, [recipeMenuId, recipes])

  async function run(action: FormAction, data: FormData) {
    setBusy(true)
    try {
      const result = await action(data)
      toast(result.ok ? "success" : "error", result.message)
      if (result.ok) {
        if (typeof BroadcastChannel !== "undefined") {
          const channel = new BroadcastChannel("prime-device-cache")
          channel.postMessage({ type: "catalog-invalidated" })
          channel.close()
        }
        setModal(null)
        router.refresh()
      }
    } catch {
      toast("error", "Something went wrong", "Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function submitCategory(
    event: React.FormEvent<HTMLFormElement>,
    action: FormAction,
    clear: () => void
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    try {
      const result = await action(data)
      toast(result.ok ? "success" : "error", result.message)
      if (result.ok) {
        if (typeof BroadcastChannel !== "undefined") {
          const channel = new BroadcastChannel("prime-device-cache")
          channel.postMessage({ type: "catalog-invalidated" })
          channel.close()
        }
        clear()
        form.reset()
        router.refresh()
      }
    } catch {
      toast("error", "Something went wrong", "Try again.")
    } finally {
      setBusy(false)
    }
  }

  function openIngredient(item?: Ingredient) {
    setEditingIngredient(item ?? null)
    setModal("ingredient")
  }
  function openMenu(item?: Menu) {
    setEditingMenu(item ?? null)
    setModal("menu")
  }
  function openStock(
    itemType: "ingredient" | "menu_item",
    id: string,
    name: string,
    unit: string
  ) {
    setMoving({ itemType, id, name, unit })
    setMovementType("stock_in")
    setModal("stock")
  }
  async function changeIngredientStatus(item: Ingredient) {
    const nextActive = !item.isActive
    if (
      !nextActive &&
      !(await confirm({
        title: "Archive ingredient?",
        description: `${item.name} will no longer be available for new recipes or stock updates. Existing recipe links will remain saved.`,
        confirmLabel: "Archive",
        destructive: true,
      }))
    )
      return
    const data = new FormData()
    data.set("id", item.id)
    data.set("active", String(nextActive))
    void run(setInventoryItemActive, data)
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {menuOnly ? "Menu Management" : "Inventory"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {menuOnly
              ? "Manage menu items, prices, categories, and availability."
              : "Ingredients, menu items, recipes, and stock all connected to your database."}
          </p>
        </div>
        {tab === "ingredients" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openIngredient()}
            >
              <Plus className="mr-1 size-4" />
              Ingredient
            </Button>
          </div>
        ) : null}
        {tab === "menu" ? (
          <Button size="sm" onClick={() => openMenu()}>
            <Plus className="mr-1 size-4" />
            Menu item
          </Button>
        ) : null}
      </header>

      {!menuOnly ? (
        <nav
          aria-label="Inventory sections"
          className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${tab === id ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/70"}`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>
      ) : null}

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              title="Active ingredients"
              value={String(activeIngredients.length)}
              detail={`${ingredientCategories.length} ingredient categories`}
            />
            <Stat
              title="Low stock"
              value={String(lowStock.length)}
              detail="At or below reorder threshold"
              alert={lowStock.length > 0}
            />
            <Stat
              title="Active menu items"
              value={String(availableMenu.length)}
              detail={`${menuCategories.filter((category) => category.isActive).length} menu categories`}
            />
            <Stat
              title="Ingredient stock value"
              value={peso(stockValue)}
              detail="Quantity × unit cost"
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-base">Reorder list</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStock.length ? (
                  <div className="divide-y">
                    {lowStock.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.categoryName ?? "Uncategorized"}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {item.stockQuantity} {item.unit} · reorder at{" "}
                          {item.reorderThreshold}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ingredients need reordering.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Recent stock activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.slice(0, 5).length ? (
                  <div className="divide-y">
                    {logs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{log.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.type.replace("_", " ")} ·{" "}
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={
                            log.quantityChange < 0
                              ? "text-sm font-semibold text-rose-600"
                              : "text-sm font-semibold text-emerald-600"
                          }
                        >
                          {log.quantityChange > 0 ? "+" : ""}
                          {log.quantityChange}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Stock movements will appear here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "ingredients" ? (
        <Card size="sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Ingredients & stock</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingredient balances power linked menu recipes.
              </p>
            </div>
            <form
              className="flex max-w-sm gap-2"
              onSubmit={(event) =>
                submitCategory(event, saveInventoryCategory, () =>
                  setIngredientCategory("")
                )
              }
            >
              <Input
                name="name"
                value={ingredientCategory}
                onChange={(event) => setIngredientCategory(event.target.value)}
                placeholder="New ingredient category"
                aria-label="New ingredient category"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={busy || !ingredientCategory.trim()}
              >
                Add
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Ingredient</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">On hand</th>
                    <th className="pb-2 font-medium">Reorder at</th>
                    <th className="pb-2 font-medium">Unit cost</th>
                    <th className="pb-2 font-medium">Supplier</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">
                          {item.name}
                          {!item.isActive ? (
                            <Badge variant="secondary" className="ml-2">
                              Archived
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.unit}
                        </div>
                      </td>
                      <td>{item.categoryName ?? "Uncategorized"}</td>
                      <td>
                        <span
                          className={
                            item.isActive &&
                            item.reorderThreshold !== null &&
                            item.stockQuantity <= item.reorderThreshold
                              ? "font-semibold text-rose-600"
                              : ""
                          }
                        >
                          {item.stockQuantity} {item.unit}
                        </span>
                      </td>
                      <td>{item.reorderThreshold ?? "—"}</td>
                      <td>
                        {item.unitCost === null ? "—" : peso(item.unitCost)}
                      </td>
                      <td>{item.supplier || "—"}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openStock(
                                "ingredient",
                                item.id,
                                item.name,
                                item.unit
                              )
                            }
                            disabled={!item.isActive}
                          >
                            Stock
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => openIngredient(item)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`${item.isActive ? "Archive" : "Activate"} ${item.name}`}
                            onClick={() => void changeIngredientStatus(item)}
                          >
                            <Archive className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!ingredients.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No ingredients yet. Add one to start tracking stock.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "menu" ? (
        <Card size="sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Menu items</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage menu categories, prices, availability, and optional
                direct stock.
              </p>
            </div>
            <form
              className="flex max-w-sm gap-2"
              onSubmit={(event) =>
                submitCategory(event, saveMenuCategory, () =>
                  setMenuCategory("")
                )
              }
            >
              <Input
                name="name"
                value={menuCategory}
                onChange={(event) => setMenuCategory(event.target.value)}
                placeholder="New menu category"
                aria-label="New menu category"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={busy || !menuCategory.trim()}
              >
                Add category
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Menu item</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Direct stock</th>
                    <th className="pb-2 font-medium">Recipe</th>
                    <th className="pb-2 font-medium">Availability</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="max-w-56 truncate text-xs text-muted-foreground">
                              {item.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{item.categoryName}</td>
                      <td>{peso(item.price)}</td>
                      <td>
                        {item.stockQuantity === null
                          ? "Not tracked"
                          : item.stockQuantity}
                      </td>
                      <td>
                        {
                          recipes.filter((line) => line.menuItemId === item.id)
                            .length
                        }{" "}
                        ingredients
                      </td>
                      <td>
                        <Badge
                          variant={item.isAvailable ? "default" : "secondary"}
                        >
                          {item.isAvailable ? "Available" : "Hidden"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          {item.stockQuantity !== null ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openStock(
                                  "menu_item",
                                  item.id,
                                  item.name,
                                  "pcs"
                                )
                              }
                            >
                              Stock
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRecipeMenuId(item.id)
                              setTab("recipes")
                            }}
                          >
                            Recipe
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => openMenu(item)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const data = new FormData()
                              data.set("id", item.id)
                              data.set("available", String(!item.isAvailable))
                              void run(setMenuItemAvailability, data)
                            }}
                          >
                            {item.isAvailable ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!menuItems.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No menu items yet. Add menu categories and items to
                        connect them with inventory.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "recipes" ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Menu recipes</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect each menu item to the quantities of ingredients it uses.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!menuItems.length ? (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                Create a menu item first to build its recipe.
              </p>
            ) : (
              <>
                <FieldLabel label="Menu item">
                  <select
                    className={inputClass}
                    value={recipeMenuId}
                    onChange={(event) => setRecipeMenuId(event.target.value)}
                  >
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <div className="space-y-2">
                  {recipeLines.map((line, index) => (
                    <div
                      key={index}
                      className="grid gap-2 sm:grid-cols-[1fr_160px_auto]"
                    >
                      <select
                        className={inputClass}
                        value={line.inventoryItemId}
                        onChange={(event) =>
                          setRecipeLines((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? {
                                    ...row,
                                    inventoryItemId: event.target.value,
                                  }
                                : row
                            )
                          )
                        }
                      >
                        <option value="">Choose ingredient</option>
                        {activeIngredients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={line.quantityUsed}
                        onChange={(event) =>
                          setRecipeLines((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, quantityUsed: event.target.value }
                                : row
                            )
                          )
                        }
                        placeholder="Quantity per menu item"
                        aria-label="Quantity per menu item"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove ingredient from recipe"
                        onClick={async () => {
                          const ingredient = activeIngredients.find(
                            (item) => item.id === line.inventoryItemId
                          )
                          const approved = await confirm({
                            title: "Remove ingredient from recipe?",
                            description: `${ingredient?.name ?? "This ingredient"} will be removed from the recipe draft. Save the recipe to apply the change.`,
                            confirmLabel: "Remove",
                            destructive: true,
                          })
                          if (approved)
                            setRecipeLines((current) =>
                              current.filter(
                                (_, rowIndex) => rowIndex !== index
                              )
                            )
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {activeIngredients.length ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRecipeLines((current) => [
                          ...current,
                          {
                            inventoryItemId:
                              activeIngredients.find(
                                (item) =>
                                  !current.some(
                                    (line) => line.inventoryItemId === item.id
                                  )
                              )?.id ?? "",
                            quantityUsed: "1",
                          },
                        ])
                      }
                      disabled={recipeLines.length >= activeIngredients.length}
                    >
                      <Plus className="mr-1 size-4" />
                      Add ingredient
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add active ingredients before building a recipe.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        busy ||
                        !recipeMenuId ||
                        recipeLines.some(
                          (line) =>
                            !line.inventoryItemId ||
                            Number(line.quantityUsed) <= 0
                        )
                      }
                      onClick={() => {
                        const data = new FormData()
                        data.set("menuItemId", recipeMenuId)
                        data.set(
                          "ingredients",
                          JSON.stringify(
                            recipeLines.map((line) => ({
                              inventoryItemId: line.inventoryItemId,
                              quantityUsed: Number(line.quantityUsed),
                            }))
                          )
                        )
                        void run(saveMenuRecipe, data)
                      }}
                    >
                      Save recipe
                    </Button>
                  </div>
                  {recipeLines.length && recipeIsSaved ? (
                    <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                      <div>
                        <p className="text-sm font-medium">
                          Manual usage outside Live Orders
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Live Orders already deduct stock when accepted; use
                          this only for off-system sales.
                        </p>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="space-y-1 text-xs font-medium">
                          Qty sold
                          <Input
                            className="w-24"
                            type="number"
                            min="1"
                            step="1"
                            value={usageQuantity}
                            onChange={(event) =>
                              setUsageQuantity(event.target.value)
                            }
                          />
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy || Number(usageQuantity) < 1}
                          onClick={() => {
                            const data = new FormData()
                            data.set("menuItemId", recipeMenuId)
                            data.set("quantity", usageQuantity)
                            void run(recordMenuUsage, data)
                          }}
                        >
                          <Boxes className="mr-1 size-4" />
                          Record usage
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {recipeLines.length && !recipeIsSaved ? (
                    <p className="text-xs text-muted-foreground">
                      Save recipe changes before recording menu usage.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "movements" ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Stock movement history</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Audit trail of stock received, adjusted, and wasted.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Change</th>
                    <th className="pb-2 font-medium">Balance</th>
                    <th className="pb-2 font-medium">Note</th>
                    <th className="pb-2 font-medium">Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>{log.itemName}</td>
                      <td className="capitalize">
                        {log.type.replace("_", " ")}
                      </td>
                      <td
                        className={
                          log.quantityChange < 0
                            ? "font-medium text-rose-600"
                            : "font-medium text-emerald-600"
                        }
                      >
                        {log.quantityChange > 0 ? "+" : ""}
                        {log.quantityChange}
                      </td>
                      <td>{log.quantityAfter ?? "—"}</td>
                      <td>{log.note || "—"}</td>
                      <td>{log.performedBy || "Admin"}</td>
                    </tr>
                  ))}
                  {!logs.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No stock movements recorded.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {modal === "ingredient" ? (
        <ModalShell
          title={editingIngredient ? "Edit ingredient" : "Add ingredient"}
          onClose={() => setModal(null)}
        >
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void run(saveInventoryItem, new FormData(event.currentTarget))
            }}
          >
            <input
              type="hidden"
              name="id"
              value={editingIngredient?.id ?? ""}
            />
            <FieldLabel label="Ingredient name">
              <Input
                name="name"
                required
                maxLength={150}
                defaultValue={editingIngredient?.name ?? ""}
                placeholder="e.g. Chicken breast"
              />
            </FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldLabel label="Category">
                <select
                  name="categoryId"
                  className={inputClass}
                  defaultValue={editingIngredient?.categoryId ?? ""}
                >
                  <option value="">Uncategorized</option>
                  {ingredientCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Unit">
                <Input
                  name="unit"
                  required
                  maxLength={30}
                  defaultValue={editingIngredient?.unit ?? "kg"}
                  placeholder="kg, g, L, pcs"
                />
              </FieldLabel>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldLabel label="Reorder threshold">
                <Input
                  name="reorderThreshold"
                  type="number"
                  min="0"
                  step="0.001"
                  defaultValue={editingIngredient?.reorderThreshold ?? ""}
                  placeholder="Optional"
                />
              </FieldLabel>
              <FieldLabel label="Unit cost (₱)">
                <Input
                  name="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingIngredient?.unitCost ?? ""}
                  placeholder="Optional"
                />
              </FieldLabel>
            </div>
            <FieldLabel label="Supplier (optional)">
              <Input
                name="supplier"
                maxLength={150}
                defaultValue={editingIngredient?.supplier ?? ""}
              />
            </FieldLabel>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button disabled={busy}>
                {busy ? "Saving…" : "Save ingredient"}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {modal === "menu" ? (
        <ModalShell
          title={editingMenu ? "Edit menu item" : "Add menu item"}
          onClose={() => setModal(null)}
        >
          <form
            encType="multipart/form-data"
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void run(saveMenuItem, new FormData(event.currentTarget))
            }}
          >
            <input type="hidden" name="id" value={editingMenu?.id ?? ""} />
            <FieldLabel label="Menu name">
              <Input
                name="name"
                required
                maxLength={150}
                defaultValue={editingMenu?.name ?? ""}
                placeholder="e.g. Chicken Adobo"
              />
            </FieldLabel>
            <FieldLabel label="Category">
              <select
                name="categoryId"
                className={inputClass}
                required
                defaultValue={
                  editingMenu?.categoryId ??
                  menuCategories.find((item) => item.isActive)?.id ??
                  ""
                }
              >
                <option value="" disabled>
                  Select category
                </option>
                {menuCategories
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Description">
              <textarea
                name="description"
                rows={2}
                maxLength={65535}
                className={inputClass}
                defaultValue={editingMenu?.description ?? ""}
              />
            </FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldLabel label="Price (₱)">
                <Input
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={editingMenu?.price ?? 0}
                />
              </FieldLabel>
              <FieldLabel
                label={
                  editingMenu
                    ? "Direct stock"
                    : "Opening direct stock (optional)"
                }
              >
                <Input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingMenu?.stockQuantity ?? ""}
                  placeholder="Blank = recipe only"
                  disabled={Boolean(editingMenu)}
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  {editingMenu
                    ? "Use the Stock action to record changes."
                    : "Leave blank if inventory is tracked by recipe ingredients."}
                </span>
              </FieldLabel>
            </div>
            <FieldLabel label="Menu image">
              {editingMenu?.imageUrl ? (
                <img
                  src={editingMenu.imageUrl}
                  alt={`${editingMenu.name} current menu image`}
                  className="mb-2 h-28 w-40 rounded-md border object-cover"
                />
              ) : null}
              <Input
                name="imageFile"
                type="file"
                accept="image/jpeg,image/jfif,.jfif,image/png,image/webp,image/gif"
                className="h-auto py-2 file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium"
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Choose an image from this device (JPG/JPEG/JFIF, PNG, WEBP, or
                GIF; up to 5 MB).
                {editingMenu?.imageUrl
                  ? " Leave empty to keep the current image, or choose a new file to replace it."
                  : ""}
              </span>
            </FieldLabel>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isAvailable"
                defaultChecked={editingMenu?.isAvailable ?? true}
                className="size-4 accent-amber-600"
              />
              Available to order
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={busy || !menuCategories.some((item) => item.isActive)}
              >
                {busy ? "Saving…" : "Save menu item"}
              </Button>
            </div>
            {!menuCategories.some((item) => item.isActive) ? (
              <p className="text-xs text-destructive">
                Add a menu category first.
              </p>
            ) : null}
          </form>
        </ModalShell>
      ) : null}

      {modal === "stock" && moving ? (
        <ModalShell
          title={`Update stock · ${moving.name}`}
          onClose={() => setModal(null)}
        >
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void run(recordStockMovement, new FormData(event.currentTarget))
            }}
          >
            <input type="hidden" name="itemType" value={moving.itemType} />
            <input type="hidden" name="itemId" value={moving.id} />
            <FieldLabel label="Movement">
              <select
                name="type"
                className={inputClass}
                value={movementType}
                onChange={(event) =>
                  setMovementType(event.target.value as typeof movementType)
                }
              >
                <option value="stock_in">Stock in</option>
                <option value="adjustment">Adjustment (use + or −)</option>
                <option value="waste">Waste / spoilage</option>
              </select>
            </FieldLabel>
            <FieldLabel label={`Quantity (${moving.unit})`}>
              <Input
                name="quantity"
                type="number"
                required
                min={movementType === "adjustment" ? undefined : "0.001"}
                step={moving.itemType === "menu_item" ? "1" : "0.001"}
              />
            </FieldLabel>
            <FieldLabel label="Note (optional)">
              <Input
                name="note"
                maxLength={255}
                placeholder="Invoice, count correction, spoilage reason…"
              />
            </FieldLabel>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button disabled={busy}>
                {busy ? "Saving…" : "Record movement"}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </main>
  )
}

function Stat({
  title,
  value,
  detail,
  alert = false,
}: {
  title: string
  value: string
  detail: string
  alert?: boolean
}) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p
          className={`mt-1 text-2xl font-semibold ${alert ? "text-rose-600" : ""}`}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
