import { getInitializedDataSource } from "@/lib/database/data-source"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { OrderDiscount } from "@/lib/database/entities/entities/OrderDiscount"
import { OrderPromotion } from "@/lib/database/entities/entities/OrderPromotion"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import { DiscountsWorkspace } from "./workspace"
import type { DiscountTypeRow, MenuOption, PromotionRow } from "./types"

export default async function DiscountsPage() {
  try {
    const source = await getInitializedDataSource()
    const [discounts, promotions, menuItems] = await Promise.all([
      source.getRepository(DiscountType).find({ order: { name: "ASC" } }),
      source.getRepository(Promotion).find({
        relations: { items: true },
        order: { createdAt: "DESC" },
      }),
      source.getRepository(MenuItem).find({
        relations: { category: true },
        order: { name: "ASC" },
      }),
    ])
    const [discountRows, promotionRows] = await Promise.all([
      Promise.all(
        discounts.map(async (item): Promise<DiscountTypeRow> => ({
          id: item.id,
          name: item.name,
          percentage: Number(item.percentage),
          requiresIdVerification: item.requiresIdVerification,
          isActive: item.isActive,
          orderCount: await source
            .getRepository(OrderDiscount)
            .countBy({ discountTypeId: item.id }),
        }))
      ),
      Promise.all(
        promotions.map(async (item): Promise<PromotionRow> => ({
          id: item.id,
          name: item.name,
          description: item.description,
          promoType: item.promoType,
          discountValue:
            item.discountValue === null ? null : Number(item.discountValue),
          minSpend: item.minSpend === null ? null : Number(item.minSpend),
          startDate: item.startDate,
          endDate: item.endDate,
          usageLimit: item.usageLimit,
          usageCount: item.usageCount,
          isActive: item.isActive,
          menuItemIds: item.items.map((menu) => menu.id),
          menuItemNames: item.items.map((menu) => menu.name),
          orderCount: await source
            .getRepository(OrderPromotion)
            .countBy({ promotionId: item.id }),
        }))
      ),
    ])
    const menuOptions: MenuOption[] = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      categoryName: item.category?.name ?? "Menu",
    }))
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
    return (
      <DiscountsWorkspace
        discounts={discountRows}
        promotions={promotionRows}
        menuItems={menuOptions}
        today={today}
      />
    )
  } catch (error) {
    console.error("Unable to load discounts and promotions:", error)
    const configMissing =
      error instanceof Error &&
      error.message.startsWith("Missing database configuration:")
    return (
      <main className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discounts &amp; Promos
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage checkout discounts and menu promotions.
          </p>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm"
        >
          {configMissing
            ? "Set DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_DATABASE in .env.local to connect discounts and promotions."
            : "Discounts and promotions could not load. Check the database connection and apply the project migrations."}
        </div>
      </main>
    )
  }
}
