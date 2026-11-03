"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { del, put } from "@vercel/blob"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Category } from "@/lib/database/entities/entities/Category"
import { InventoryCategory } from "@/lib/database/entities/entities/InventoryCategory"
import { InventoryItem } from "@/lib/database/entities/entities/InventoryItem"
import { InventoryStockLog } from "@/lib/database/entities/entities/InventoryStockLog"
import { MenuItem } from "@/lib/database/entities/entities/MenuItem"
import { MenuItemIngredient } from "@/lib/database/entities/entities/MenuItemIngredient"
import {
  inventoryItemSchema,
  menuItemSchema,
} from "@/lib/validations/inventory"

const text = (data: FormData, key: string) => {
  const value = data.get(key)
  return typeof value === "string" ? value.trim() : ""
}
function refreshInventory() {
  revalidatePath("/admin/inventory")
  revalidatePath("/admin/menu")
}

export async function saveInventoryCategory(data: FormData) {
  const name = z.string().trim().min(1).max(100).safeParse(text(data, "name"))
  if (!name.success)
    return {
      ok: false,
      message: "Enter a category name (up to 100 characters).",
    }
  try {
    const repo = (await getInitializedDataSource()).getRepository(
      InventoryCategory
    )
    if (
      await repo
        .createQueryBuilder("c")
        .where("LOWER(c.name) = LOWER(:name)", { name: name.data })
        .getOne()
    ) {
      return { ok: false, message: "That ingredient category already exists." }
    }
    await repo.save(repo.create({ id: randomUUID(), name: name.data }))
    refreshInventory()
    return { ok: true, message: "Ingredient category added." }
  } catch (error) {
    console.error("Unable to save inventory category:", error)
    return {
      ok: false,
      message: "Could not save the category. Check the database connection.",
    }
  }
}

export async function saveMenuCategory(data: FormData) {
  const name = z.string().trim().min(1).max(100).safeParse(text(data, "name"))
  if (!name.success)
    return {
      ok: false,
      message: "Enter a category name (up to 100 characters).",
    }
  try {
    const repo = (await getInitializedDataSource()).getRepository(Category)
    if (
      await repo
        .createQueryBuilder("c")
        .where("LOWER(c.name) = LOWER(:name)", { name: name.data })
        .getOne()
    ) {
      return { ok: false, message: "That menu category already exists." }
    }
    const maxSort = await repo
      .createQueryBuilder("c")
      .select("MAX(c.sortOrder)", "max")
      .getRawOne<{ max: number | null }>()
    await repo.save(
      repo.create({
        id: randomUUID(),
        name: name.data,
        sortOrder: Number(maxSort?.max ?? 0) + 1,
        isActive: true,
      })
    )
    refreshInventory()
    return { ok: true, message: "Menu category added." }
  } catch (error) {
    console.error("Unable to save menu category:", error)
    return {
      ok: false,
      message: "Could not save the category. Check the database connection.",
    }
  }
}

export async function saveInventoryItem(data: FormData) {
  const parsed = inventoryItemSchema.safeParse({
    id: text(data, "id"),
    name: text(data, "name"),
    categoryId: text(data, "categoryId"),
    unit: text(data, "unit"),
    reorderThreshold: text(data, "reorderThreshold") || null,
    unitCost: text(data, "unitCost") || null,
    supplier: text(data, "supplier"),
  })
  if (!parsed.success)
    return {
      ok: false,
      message: "Check the ingredient name, unit, and numeric values.",
    }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const repo = manager.getRepository(InventoryItem)
      const values = parsed.data
      const item = values.id
        ? await repo.findOneBy({ id: values.id })
        : repo.create({ id: randomUUID(), stockQuantity: 0, isActive: true })
      if (!item)
        throw new Error("Ingredient not found. Refresh the page and try again.")
      if (
        values.categoryId &&
        !(await manager
          .getRepository(InventoryCategory)
          .existsBy({ id: values.categoryId }))
      )
        throw new Error("Choose an existing ingredient category.")
      item.name = values.name
      item.categoryId = values.categoryId
      item.unit = values.unit
      item.reorderThreshold = values.reorderThreshold
      item.unitCost = values.unitCost
      item.supplier = values.supplier || null
      item.updatedAt = new Date()
      await repo.save(item)
    })
    refreshInventory()
    return { ok: true, message: "Ingredient saved." }
  } catch (error) {
    console.error("Unable to save inventory item:", error)
    return {
      ok: false,
      message:
        error instanceof Error &&
        error.message ===
          "Ingredient not found. Refresh the page and try again."
          ? error.message
          : "Could not save the ingredient. Check the database connection.",
    }
  }
}

export async function recordStockMovement(data: FormData) {
  const parsed = z
    .object({
      itemType: z.enum(["ingredient", "menu_item"]),
      itemId: z.string().uuid(),
      type: z.enum(["stock_in", "adjustment", "waste"]),
      quantity: z.coerce
        .number()
        .finite()
        .min(-1_000_000)
        .max(1_000_000)
        .refine((value) => value !== 0),
      note: z.string().trim().max(255),
    })
    .safeParse({
      itemType: text(data, "itemType"),
      itemId: text(data, "itemId"),
      type: text(data, "type"),
      quantity: text(data, "quantity"),
      note: text(data, "note"),
    })
  if (!parsed.success)
    return {
      ok: false,
      message: "Enter a non-zero quantity and valid stock movement details.",
    }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const { itemType, itemId, type, note } = parsed.data
      const isIngredient = itemType === "ingredient"
      if (type !== "adjustment" && parsed.data.quantity < 0)
        throw new Error("Stock in and waste quantities must be positive.")
      const quantity = parsed.data.quantity
      if (!isIngredient && !Number.isInteger(quantity))
        throw new Error("Menu item stock must be a whole number.")
      const delta =
        type === "stock_in" ? quantity : type === "waste" ? -quantity : quantity
      let before: number
      let after: number
      if (isIngredient) {
        const repo = manager.getRepository(InventoryItem)
        const item = await repo.findOneBy({ id: itemId })
        if (!item)
          throw new Error("Item not found. Refresh the page and try again.")
        before = Number(item.stockQuantity)
        after = before + delta
        if (after < 0)
          throw new Error("This movement would make stock negative.")
        item.stockQuantity = after
        item.updatedAt = new Date()
        await repo.save(item)
      } else {
        const repo = manager.getRepository(MenuItem)
        const item = await repo.findOneBy({ id: itemId })
        if (!item)
          throw new Error("Item not found. Refresh the page and try again.")
        before = Number(item.stockQuantity ?? 0)
        after = before + delta
        if (after < 0)
          throw new Error("This movement would make stock negative.")
        item.stockQuantity = after
        item.updatedAt = new Date()
        await repo.save(item)
      }
      await manager.getRepository(InventoryStockLog).save(
        manager.getRepository(InventoryStockLog).create({
          id: randomUUID(),
          itemType,
          inventoryItemId: isIngredient ? itemId : null,
          menuItemId: isIngredient ? null : itemId,
          type,
          quantityChange: delta,
          quantityAfter: after,
          note: note || null,
          performedByStaffId: null,
        })
      )
    })
    refreshInventory()
    return { ok: true, message: "Stock movement recorded." }
  } catch (error) {
    console.error("Unable to record stock movement:", error)
    return {
      ok: false,
      message:
        error instanceof Error &&
        [
          "Item not found. Refresh the page and try again.",
          "This movement would make stock negative.",
          "Menu item stock must be a whole number.",
          "Stock in and waste quantities must be positive.",
        ].includes(error.message)
          ? error.message
          : "Could not update stock. Check the database connection.",
    }
  }
}

export async function saveMenuItem(data: FormData) {
  const uploaded = data.get("imageFile")
  let imageFile: File | null = null
  let imageMimeType: string | null = null
  let uploadedBlobUrl: string | null = null
  if (uploaded && typeof uploaded !== "string" && uploaded.size > 0) {
    const isJfif =
      uploaded.type === "image/jfif" || /\.jfif$/i.test(uploaded.name)
    const mimeTypes: Record<string, string> = {
      "image/jpeg": "image/jpeg",
      "image/png": "image/png",
      "image/webp": "image/webp",
      "image/gif": "image/gif",
    }
    imageMimeType = isJfif ? "image/jpeg" : (mimeTypes[uploaded.type] ?? null)
    if (!imageMimeType)
      return {
        ok: false,
        message: "Choose a JPG/JPEG/JFIF, PNG, WEBP, or GIF image.",
      }
    if (uploaded.size > 5 * 1024 * 1024)
      return { ok: false, message: "Menu images must be 5 MB or smaller." }
    if (imageMimeType === "image/jpeg") {
      const signature = new Uint8Array(await uploaded.slice(0, 3).arrayBuffer())
      if (
        signature.length !== 3 ||
        signature[0] !== 0xff ||
        signature[1] !== 0xd8 ||
        signature[2] !== 0xff
      )
        return {
          ok: false,
          message: "The selected file is not a valid JPEG image.",
        }
    }
    imageFile = uploaded
  }
  const parsed = menuItemSchema.safeParse({
    id: text(data, "id"),
    name: text(data, "name"),
    categoryId: text(data, "categoryId"),
    description: text(data, "description"),
    price: text(data, "price"),
    imageUrl: imageFile ? "/pending-image" : "",
    isAvailable: data.get("isAvailable") === "on",
    stockQuantity: text(data, "stockQuantity"),
  })
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the menu name, category, price, and stock value.",
    }
  }
  try {
    if (imageFile && imageMimeType) {
      const extensions: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
      }
      const blob = await put(
        `menu/${randomUUID()}${extensions[imageMimeType]}`,
        imageFile,
        {
          access: "public",
          contentType: imageMimeType,
          addRandomSuffix: false,
          cacheControlMaxAge: 3600,
        }
      )
      uploadedBlobUrl = blob.url
    }

    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const repo = manager.getRepository(MenuItem)
      const values = parsed.data
      const item = values.id
        ? await repo.findOneBy({ id: values.id })
        : repo.create({ id: randomUUID() })
      if (!item) throw new Error("Menu item not found. Refresh and try again.")
      const previousStock = values.id ? item.stockQuantity : null
      if (
        !(await manager
          .getRepository(Category)
          .existsBy({ id: values.categoryId, isActive: true }))
      )
        throw new Error("Choose an active menu category.")
      item.name = values.name
      item.categoryId = values.categoryId
      item.description = values.description || null
      item.price = values.price
      if (uploadedBlobUrl) {
        item.imageUrl = uploadedBlobUrl
      } else if (!values.id) {
        item.imageUrl = null
      }
      item.isAvailable = values.isAvailable
      item.stockQuantity = values.id ? previousStock : values.stockQuantity
      item.updatedAt = new Date()
      await repo.save(item)
      if (
        !values.id &&
        values.stockQuantity !== null &&
        values.stockQuantity > 0
      ) {
        const logRepository = manager.getRepository(InventoryStockLog)
        await logRepository.save(
          logRepository.create({
            id: randomUUID(),
            itemType: "menu_item",
            inventoryItemId: null,
            menuItemId: item.id,
            type: "stock_in",
            quantityChange: values.stockQuantity,
            quantityAfter: values.stockQuantity,
            note: "Opening stock",
            performedByStaffId: null,
          })
        )
      }
    })
    refreshInventory()
    return { ok: true, message: "Menu item saved." }
  } catch (error) {
    console.error("Unable to save menu item:", error)
    if (uploadedBlobUrl) await del(uploadedBlobUrl).catch(() => undefined)
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : ""
    return {
      ok: false,
      message:
        error instanceof Error &&
        [
          "Menu item not found. Refresh and try again.",
          "Choose an active menu category.",
        ].includes(error.message)
          ? error.message
          : uploadedBlobUrl === null && imageFile
            ? "Could not upload the image. Connect the Vercel Blob store and make sure BLOB_READ_WRITE_TOKEN is configured."
            : errorMessage.includes("blob") || errorMessage.includes("token")
              ? "Could not upload the image. Connect the Vercel Blob store and make sure BLOB_READ_WRITE_TOKEN is configured."
              : "Could not save the menu item. Check the database connection.",
    }
  }
}

export async function saveMenuRecipe(data: FormData) {
  const parsed = z
    .object({
      menuItemId: z.string().uuid(),
      ingredients: z
        .array(
          z.object({
            inventoryItemId: z.string().uuid(),
            quantityUsed: z.number().positive().max(1_000_000),
          })
        )
        .max(100),
    })
    .safeParse({
      menuItemId: text(data, "menuItemId"),
      ingredients: (() => {
        try {
          return JSON.parse(text(data, "ingredients") || "[]")
        } catch {
          return null
        }
      })(),
    })
  if (!parsed.success)
    return { ok: false, message: "Check the recipe and ingredient quantities." }
  if (
    new Set(parsed.data.ingredients.map((line) => line.inventoryItemId))
      .size !== parsed.data.ingredients.length
  )
    return {
      ok: false,
      message: "Each ingredient can appear only once in a recipe.",
    }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      if (
        !(await manager
          .getRepository(MenuItem)
          .existsBy({ id: parsed.data.menuItemId }))
      )
        throw new Error("Menu item not found.")
      const ingredientIds = parsed.data.ingredients.map(
        (line) => line.inventoryItemId
      )
      if (
        ingredientIds.length &&
        (await manager
          .getRepository(InventoryItem)
          .countBy(ingredientIds.map((id) => ({ id, isActive: true })))) !==
          ingredientIds.length
      )
        throw new Error("One or more ingredients are inactive or missing.")
      const recipeRepo = manager.getRepository(MenuItemIngredient)
      await recipeRepo.delete({ menuItemId: parsed.data.menuItemId })
      if (parsed.data.ingredients.length)
        await recipeRepo.save(
          parsed.data.ingredients.map((line) =>
            recipeRepo.create({ menuItemId: parsed.data.menuItemId, ...line })
          )
        )
    })
    refreshInventory()
    return {
      ok: true,
      message: "Recipe saved and linked to inventory ingredients.",
    }
  } catch (error) {
    console.error("Unable to save menu recipe:", error)
    return {
      ok: false,
      message:
        error instanceof Error &&
        [
          "Menu item not found.",
          "One or more ingredients are inactive or missing.",
        ].includes(error.message)
          ? error.message
          : "Could not save the recipe. Check the database connection.",
    }
  }
}

/** Manual usage entry today; the same transaction can be called from the POS order-completion action. */
export async function recordMenuUsage(data: FormData) {
  const parsed = z
    .object({
      menuItemId: z.string().uuid(),
      quantity: z.coerce.number().int().positive().max(100_000),
    })
    .safeParse({
      menuItemId: text(data, "menuItemId"),
      quantity: text(data, "quantity"),
    })
  if (!parsed.success)
    return { ok: false, message: "Enter a valid menu item and quantity." }
  try {
    const source = await getInitializedDataSource()
    await source.transaction(async (manager) => {
      const menu = await manager
        .getRepository(MenuItem)
        .createQueryBuilder("menu")
        .setLock("pessimistic_write")
        .where("menu.id = :id", { id: parsed.data.menuItemId })
        .getOne()
      if (!menu) throw new Error("Menu item not found.")
      const recipe = await manager
        .getRepository(MenuItemIngredient)
        .findBy({ menuItemId: menu.id })
      if (!recipe.length)
        throw new Error("Add recipe ingredients before recording menu usage.")
      const quantity = parsed.data.quantity
      const logRepository = manager.getRepository(InventoryStockLog)
      for (const line of recipe) {
        const ingredient = await manager
          .getRepository(InventoryItem)
          .createQueryBuilder("ingredient")
          .setLock("pessimistic_write")
          .where("ingredient.id = :id", { id: line.inventoryItemId })
          .getOne()
        if (!ingredient || !ingredient.isActive)
          throw new Error("A recipe ingredient is inactive or missing.")
        const used = Number(line.quantityUsed) * quantity
        const after = Number(ingredient.stockQuantity) - used
        if (after < 0)
          throw new Error(`Not enough ${ingredient.name} in stock.`)
        ingredient.stockQuantity = after
        ingredient.updatedAt = new Date()
        await manager.getRepository(InventoryItem).save(ingredient)
        await logRepository.save(
          logRepository.create({
            id: randomUUID(),
            itemType: "ingredient",
            inventoryItemId: ingredient.id,
            menuItemId: null,
            type: "consumed",
            quantityChange: -used,
            quantityAfter: after,
            note: `Recipe usage · ${menu.name} × ${quantity}`,
            performedByStaffId: null,
          })
        )
      }
      if (menu.stockQuantity !== null) {
        const after = menu.stockQuantity - quantity
        if (after < 0)
          throw new Error(`Not enough ${menu.name} in direct stock.`)
        menu.stockQuantity = after
        menu.updatedAt = new Date()
        await manager.getRepository(MenuItem).save(menu)
        await logRepository.save(
          logRepository.create({
            id: randomUUID(),
            itemType: "menu_item",
            inventoryItemId: null,
            menuItemId: menu.id,
            type: "consumed",
            quantityChange: -quantity,
            quantityAfter: after,
            note: "Direct menu stock usage",
            performedByStaffId: null,
          })
        )
      }
    })
    refreshInventory()
    return {
      ok: true,
      message: "Menu usage recorded and recipe ingredient stocks deducted.",
    }
  } catch (error) {
    console.error("Unable to record menu usage:", error)
    const known = [
      "Menu item not found.",
      "Add recipe ingredients before recording menu usage.",
      "A recipe ingredient is inactive or missing.",
    ]
    return {
      ok: false,
      message:
        error instanceof Error &&
        (known.includes(error.message) ||
          error.message.startsWith("Not enough "))
          ? error.message
          : "Could not record menu usage. Check the database connection.",
    }
  }
}

export async function setInventoryItemActive(data: FormData) {
  const id = z.string().uuid().safeParse(text(data, "id"))
  if (!id.success) return { ok: false, message: "Invalid ingredient." }
  try {
    const repo = (await getInitializedDataSource()).getRepository(InventoryItem)
    const item = await repo.findOneBy({ id: id.data })
    if (!item) return { ok: false, message: "Ingredient not found." }
    item.isActive = data.get("active") === "true"
    item.updatedAt = new Date()
    await repo.save(item)
    refreshInventory()
    return {
      ok: true,
      message: item.isActive ? "Ingredient activated." : "Ingredient archived.",
    }
  } catch (error) {
    console.error("Unable to update ingredient status:", error)
    return {
      ok: false,
      message: "Could not update ingredient. Check the database connection.",
    }
  }
}

export async function setMenuItemAvailability(data: FormData) {
  const id = z.string().uuid().safeParse(text(data, "id"))
  if (!id.success) return { ok: false, message: "Invalid menu item." }
  try {
    const repo = (await getInitializedDataSource()).getRepository(MenuItem)
    const item = await repo.findOneBy({ id: id.data })
    if (!item) return { ok: false, message: "Menu item not found." }
    item.isAvailable = data.get("available") === "true"
    item.updatedAt = new Date()
    await repo.save(item)
    refreshInventory()
    return {
      ok: true,
      message: item.isAvailable
        ? "Menu item is available."
        : "Menu item hidden from ordering.",
    }
  } catch (error) {
    console.error("Unable to update menu availability:", error)
    return {
      ok: false,
      message: "Could not update menu item. Check the database connection.",
    }
  }
}
