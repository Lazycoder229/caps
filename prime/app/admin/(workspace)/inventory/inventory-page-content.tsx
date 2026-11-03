import { getInitializedDataSource } from "@/lib/database/data-source"
import { Category } from "@/lib/database/entities/entities/Category"
import { InventoryCategory } from "@/lib/database/entities/entities/InventoryCategory"
import { InventoryItem } from "@/lib/database/entities/entities/InventoryItem"
import { InventoryStockLog } from "@/lib/database/entities/entities/InventoryStockLog"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { MenuItemIngredient } from "@/lib/database/entities/entities/MenuItemIngredient"
import { InventoryWorkspace } from "./workspace"

export async function InventoryPageContent({
  tab = "overview",
  menuOnly = false,
}: {
  tab?: string
  menuOnly?: boolean
}) {
  try {
    const source = await getInitializedDataSource()
    const [
      ingredients,
      ingredientCategories,
      menuItems,
      menuCategories,
      recipes,
      logs,
    ] = await Promise.all([
      source
        .getRepository(InventoryItem)
        .find({ relations: { category: true }, order: { name: "ASC" } }),
      source.getRepository(InventoryCategory).find({ order: { name: "ASC" } }),
      source
        .getRepository(MenuItem)
        .find({ relations: { category: true }, order: { name: "ASC" } }),
      source
        .getRepository(Category)
        .find({ order: { sortOrder: "ASC", name: "ASC" } }),
      source.getRepository(MenuItemIngredient).find({
        relations: { inventoryItem: true },
        order: { inventoryItem: { name: "ASC" } },
      }),
      source.getRepository(InventoryStockLog).find({
        relations: { inventoryItem: true, menuItem: true, performedBy: true },
        order: { createdAt: "DESC" },
        take: 100,
      }),
    ])
    return (
      <InventoryWorkspace
        initialTab={tab}
        menuOnly={menuOnly}
        ingredients={ingredients.map((item) => ({
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          categoryName: item.category?.name ?? null,
          unit: item.unit,
          stockQuantity: Number(item.stockQuantity),
          reorderThreshold:
            item.reorderThreshold === null
              ? null
              : Number(item.reorderThreshold),
          unitCost: item.unitCost === null ? null : Number(item.unitCost),
          supplier: item.supplier,
          isActive: item.isActive,
        }))}
        ingredientCategories={ingredientCategories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        menuItems={menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          categoryName: item.category.name,
          description: item.description,
          price: Number(item.price),
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          stockQuantity: item.stockQuantity,
        }))}
        menuCategories={menuCategories.map((category) => ({
          id: category.id,
          name: category.name,
          isActive: category.isActive,
        }))}
        recipes={recipes.map((line) => ({
          menuItemId: line.menuItemId,
          inventoryItemId: line.inventoryItemId,
          quantityUsed: Number(line.quantityUsed),
        }))}
        logs={logs.map((log) => ({
          id: log.id,
          itemType: log.itemType,
          itemName:
            log.inventoryItem?.name ?? log.menuItem?.name ?? "Removed item",
          type: log.type,
          quantityChange: Number(log.quantityChange),
          quantityAfter:
            log.quantityAfter === null ? null : Number(log.quantityAfter),
          note: log.note,
          performedBy: log.performedBy?.name ?? null,
          createdAt: log.createdAt.toISOString(),
        }))}
      />
    )
  } catch (error) {
    console.error("Unable to load inventory:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {menuOnly ? "Menu Management" : "Inventory"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {menuOnly
              ? "Manage menu items, prices, categories, and availability."
              : "Manage ingredients, recipes, menu availability, and stock movements."}
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect inventory to the database."
            : "Inventory could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
