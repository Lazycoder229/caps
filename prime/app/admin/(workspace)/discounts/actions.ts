"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { In } from "typeorm"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { DiscountType } from "@/lib/database/entities/entities/DiscountType"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { OrderDiscount } from "@/lib/database/entities/entities/OrderDiscount"
import { OrderPromotion } from "@/lib/database/entities/entities/OrderPromotion"
import { Promotion } from "@/lib/database/entities/entities/Promotion"
import {
  discountIdSchema,
  discountTypeSchema,
  promotionSchema,
} from "@/lib/validations/discounts"

function refreshDiscounts() {
  revalidatePath("/admin/discounts")
  revalidatePath("/admin/orders")
}

export async function saveDiscountType(data: FormData) {
  const parsed = discountTypeSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    percentage: String(data.get("percentage") ?? ""),
    requiresIdVerification: data.get("requiresIdVerification") === "true",
    isActive: data.get("isActive") === "true",
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check discount details.",
    }
  try {
    const repo = (await getInitializedDataSource()).getRepository(DiscountType)
    const item = parsed.data.id
      ? await repo.findOneBy({ id: parsed.data.id })
      : repo.create({ id: randomUUID() })
    if (!item)
      return {
        ok: false,
        message: "Discount not found. Refresh and try again.",
      }
    item.name = parsed.data.name
    item.percentage = parsed.data.percentage
    item.requiresIdVerification = parsed.data.requiresIdVerification
    item.isActive = parsed.data.isActive
    await repo.save(item)
    refreshDiscounts()
    return { ok: true, message: "Discount saved." }
  } catch (error) {
    console.error("Unable to save discount type:", error)
    return {
      ok: false,
      message: "Could not save discount. Check the database connection.",
    }
  }
}

export async function savePromotion(data: FormData) {
  let itemIds: unknown
  try {
    itemIds = JSON.parse(String(data.get("menuItemIds") ?? "[]"))
  } catch {
    return { ok: false, message: "Choose valid menu items." }
  }
  const nullableNumber = (value: FormDataEntryValue | null) => {
    const text = String(value ?? "").trim()
    return text ? text : null
  }
  const parsed = promotionSchema.safeParse({
    id: String(data.get("id") ?? ""),
    name: String(data.get("name") ?? ""),
    description: String(data.get("description") ?? ""),
    promoType: String(data.get("promoType") ?? ""),
    discountValue: String(data.get("discountValue") ?? ""),
    minSpend: nullableNumber(data.get("minSpend")),
    startDate: String(data.get("startDate") ?? ""),
    endDate: String(data.get("endDate") ?? ""),
    usageLimit: nullableNumber(data.get("usageLimit")),
    isActive: data.get("isActive") === "true",
    menuItemIds: itemIds,
  })
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check promotion details.",
    }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const promoRepo = manager.getRepository(Promotion)
      const promo = parsed.data.id
        ? await promoRepo.findOne({
            where: { id: parsed.data.id },
            relations: { items: true },
          })
        : promoRepo.create({
            id: randomUUID(),
            usageCount: 0,
            createdByStaffId: null,
          })
      if (!promo) throw new Error("Promotion not found. Refresh and try again.")
      if (
        parsed.data.usageLimit !== null &&
        parsed.data.usageLimit < promo.usageCount
      )
        throw new Error(
          `Usage limit cannot be below the ${promo.usageCount} times already used.`
        )
      const menuItems = parsed.data.menuItemIds.length
        ? await manager
            .getRepository(MenuItem)
            .findBy({ id: In(parsed.data.menuItemIds) })
        : []
      if (menuItems.length !== parsed.data.menuItemIds.length)
        throw new Error("One or more selected menu items no longer exist.")
      promo.name = parsed.data.name
      promo.description = parsed.data.description
      promo.promoType = parsed.data.promoType
      promo.discountValue = parsed.data.discountValue
      promo.minSpend = parsed.data.minSpend
      promo.startDate = parsed.data.startDate
      promo.endDate = parsed.data.endDate
      promo.usageLimit = parsed.data.usageLimit
      promo.isActive = parsed.data.isActive
      promo.items = menuItems
      await promoRepo.save(promo)
    })
    refreshDiscounts()
    return { ok: true, message: "Promotion saved." }
  } catch (error) {
    console.error("Unable to save promotion:", error)
    const message = error instanceof Error ? error.message : ""
    return {
      ok: false,
      message:
        message === "Promotion not found. Refresh and try again." ||
        message.startsWith("Usage limit ") ||
        message.startsWith("One or more selected ")
          ? message
          : "Could not save promotion. Check the database connection.",
    }
  }
}

export async function setDiscountActive(idValue: string, active: boolean) {
  const id = discountIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid discount." }
  try {
    const repo = (await getInitializedDataSource()).getRepository(DiscountType)
    const item = await repo.findOneBy({ id: id.data })
    if (!item) return { ok: false, message: "Discount not found." }
    item.isActive = active
    await repo.save(item)
    refreshDiscounts()
    return {
      ok: true,
      message: active ? "Discount activated." : "Discount deactivated.",
    }
  } catch (error) {
    console.error("Unable to change discount status:", error)
    return { ok: false, message: "Could not change discount status." }
  }
}

export async function setPromotionActive(idValue: string, active: boolean) {
  const id = discountIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid promotion." }
  try {
    const repo = (await getInitializedDataSource()).getRepository(Promotion)
    const item = await repo.findOneBy({ id: id.data })
    if (!item) return { ok: false, message: "Promotion not found." }
    if (active && item.promoType === "buy_x_get_y")
      return {
        ok: false,
        message:
          "Buy X, Get Y needs quantity fields in the database before it can be activated.",
      }
    item.isActive = active
    await repo.save(item)
    refreshDiscounts()
    return {
      ok: true,
      message: active ? "Promotion activated." : "Promotion deactivated.",
    }
  } catch (error) {
    console.error("Unable to change promotion status:", error)
    return { ok: false, message: "Could not change promotion status." }
  }
}

export async function deleteDiscountType(idValue: string) {
  const id = discountIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid discount." }
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const repo = manager.getRepository(DiscountType)
      const item = await repo.findOneBy({ id: id.data })
      if (!item) return { ok: false as const, message: "Discount not found." }
      if (
        await manager
          .getRepository(OrderDiscount)
          .existsBy({ discountTypeId: item.id })
      )
        return {
          ok: false as const,
          message:
            "This discount is in order history and cannot be deleted. Deactivate it instead.",
        }
      await repo.remove(item)
      return { ok: true as const, message: "Discount deleted." }
    })
    if (result.ok) refreshDiscounts()
    return result
  } catch (error) {
    console.error("Unable to delete discount:", error)
    return { ok: false, message: "Could not delete discount." }
  }
}

export async function deletePromotion(idValue: string) {
  const id = discountIdSchema.safeParse(idValue)
  if (!id.success) return { ok: false, message: "Invalid promotion." }
  try {
    const source = await getInitializedDataSource()
    const result = await source.transaction(async (manager) => {
      const repo = manager.getRepository(Promotion)
      const item = await repo.findOneBy({ id: id.data })
      if (!item) return { ok: false as const, message: "Promotion not found." }
      if (
        await manager
          .getRepository(OrderPromotion)
          .existsBy({ promotionId: item.id })
      )
        return {
          ok: false as const,
          message:
            "This promotion is in order history and cannot be deleted. Deactivate it instead.",
        }
      await repo.remove(item)
      return { ok: true as const, message: "Promotion deleted." }
    })
    if (result.ok) refreshDiscounts()
    return result
  } catch (error) {
    console.error("Unable to delete promotion:", error)
    return { ok: false, message: "Could not delete promotion." }
  }
}
