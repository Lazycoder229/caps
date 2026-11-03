"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Branch } from "@/lib/database/entities/entities/Branch"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { LoyaltySetting } from "@/lib/database/entities/entities/LoyaltySetting"
import { systemSettingsSchema } from "@/lib/validations/system-settings"
import type { SettingsActionState } from "./types"

const textValue = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

const checkboxValue = (formData: FormData, name: string) =>
  formData.get(name) === "on"

export async function saveSystemSettings(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const parsed = systemSettingsSchema.safeParse({
    branchId: textValue(formData, "branchId"),
    restaurantName: textValue(formData, "restaurantName"),
    branchName: textValue(formData, "branchName"),
    contactNumber: textValue(formData, "contactNumber"),
    email: textValue(formData, "email"),
    address: textValue(formData, "address"),
    tinNumber: textValue(formData, "tinNumber"),
    birMin: textValue(formData, "birMin"),
    currencySymbol: textValue(formData, "currencySymbol"),
    currencyCode: textValue(formData, "currencyCode"),
    timezone: textValue(formData, "timezone"),
    vatEnabled: checkboxValue(formData, "vatEnabled"),
    vatRate: textValue(formData, "vatRate"),
    vatInclusive: checkboxValue(formData, "vatInclusive"),
    serviceChargeEnabled: checkboxValue(formData, "serviceChargeEnabled"),
    serviceChargeRate: textValue(formData, "serviceChargeRate"),
    seniorPwdDiscountEnabled: checkboxValue(
      formData,
      "seniorPwdDiscountEnabled"
    ),
    pointsPerTier: textValue(formData, "pointsPerTier"),
    pesoValuePerPoint: textValue(formData, "pesoValuePerPoint"),
    paymentCashEnabled: checkboxValue(formData, "paymentCashEnabled"),
    paymentGcashEnabled: checkboxValue(formData, "paymentGcashEnabled"),
    paymentMayaEnabled: checkboxValue(formData, "paymentMayaEnabled"),
    paymentQrphEnabled: checkboxValue(formData, "paymentQrphEnabled"),
    orderNumberPrefix: textValue(formData, "orderNumberPrefix"),
    autoAcceptQrOrders: checkboxValue(formData, "autoAcceptQrOrders"),
    requireTableSelection: checkboxValue(formData, "requireTableSelection"),
    deliveryEnabled: checkboxValue(formData, "deliveryEnabled"),
    deliveryFee: textValue(formData, "deliveryFee"),
    deliveryMinimumOrder: textValue(formData, "deliveryMinimumOrder"),
    managerApprovalForVoids: checkboxValue(formData, "managerApprovalForVoids"),
    lowStockThresholdAlert: textValue(formData, "lowStockThresholdAlert"),
    receiptHeader: textValue(formData, "receiptHeader"),
    receiptFooter: textValue(formData, "receiptFooter"),
    printReceiptAuto: checkboxValue(formData, "printReceiptAuto"),
    printKotAuto: checkboxValue(formData, "printKotAuto"),
    showWifiOnReceipt: checkboxValue(formData, "showWifiOnReceipt"),
    wifiSsid: textValue(formData, "wifiSsid"),
    wifiPassword: textValue(formData, "wifiPassword"),
    openingTime: textValue(formData, "openingTime"),
    closingTime: textValue(formData, "closingTime"),
    cashDrawerOpeningBalanceRequired: checkboxValue(
      formData,
      "cashDrawerOpeningBalanceRequired"
    ),
    payrollDutyHours: textValue(formData, "payrollDutyHours"),
    payrollUnpaidBreakHours: textValue(formData, "payrollUnpaidBreakHours"),
    payrollWorkdaysPerMonth: textValue(formData, "payrollWorkdaysPerMonth"),
    payrollOvertimeMultiplier: textValue(formData, "payrollOvertimeMultiplier"),
    payrollSssEmployeeShare: textValue(formData, "payrollSssEmployeeShare"),
    payrollSssEmployerShare: textValue(formData, "payrollSssEmployerShare"),
    payrollPhilhealthEmployeeShare: textValue(
      formData,
      "payrollPhilhealthEmployeeShare"
    ),
    payrollPhilhealthEmployerShare: textValue(
      formData,
      "payrollPhilhealthEmployerShare"
    ),
    payrollPagibigEmployeeShare: textValue(
      formData,
      "payrollPagibigEmployeeShare"
    ),
    payrollPagibigEmployerShare: textValue(
      formData,
      "payrollPagibigEmployerShare"
    ),
    payrollMealsDeduction: textValue(formData, "payrollMealsDeduction"),
    gcashQrImage: textValue(formData, "gcashQrImage"),
    mayaQrImage: textValue(formData, "mayaQrImage"),
    qrphQrImage: textValue(formData, "qrphQrImage"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.some(
        (issue) => issue.message === "Enable at least one payment method."
      )
        ? "Enable at least one payment method."
        : "Please review the fields with errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  try {
    const dataSource = await getInitializedDataSource()
    await dataSource.transaction(async (manager) => {
      const {
        branchId,
        branchName,
        contactNumber,
        email,
        address,
        gcashQrImage,
        mayaQrImage,
        qrphQrImage,
        wifiPassword,
        pointsPerTier,
        pesoValuePerPoint,
        ...settings
      } = parsed.data
      const settingsRepository = manager.getRepository(SystemSetting)
      const current = await settingsRepository
        .createQueryBuilder("settings")
        .take(1)
        .getOne()
      const setting = current ?? settingsRepository.create({ id: randomUUID() })

      settingsRepository.merge(setting, settings, {
        branchName,
        contactNumber,
        email: email || "",
        address,
        updatedAt: new Date(),
      })
      if (wifiPassword || checkboxValue(formData, "removeWifiPassword")) {
        setting.wifiPassword = checkboxValue(formData, "removeWifiPassword")
          ? null
          : wifiPassword
      }
      if (
        gcashQrImage !== null ||
        checkboxValue(formData, "removeGcashQrImage")
      ) {
        setting.gcashQrImage = checkboxValue(formData, "removeGcashQrImage")
          ? null
          : gcashQrImage
      }
      if (
        mayaQrImage !== null ||
        checkboxValue(formData, "removeMayaQrImage")
      ) {
        setting.mayaQrImage = checkboxValue(formData, "removeMayaQrImage")
          ? null
          : mayaQrImage
      }
      if (
        qrphQrImage !== null ||
        checkboxValue(formData, "removeQrphQrImage")
      ) {
        setting.qrphQrImage = checkboxValue(formData, "removeQrphQrImage")
          ? null
          : qrphQrImage
      }
      await settingsRepository.save(setting)

      const loyaltyRepository = manager.getRepository(LoyaltySetting)
      const currentLoyaltySettings = await loyaltyRepository.findOne({
        where: {},
      })
      const loyaltySetting =
        currentLoyaltySettings ??
        loyaltyRepository.create({ id: randomUUID() })
      loyaltySetting.pointsPerTier = pointsPerTier
      loyaltySetting.pesoValuePerPoint = pesoValuePerPoint
      loyaltySetting.updatedAt = new Date()
      await loyaltyRepository.save(loyaltySetting)

      if (branchId) {
        const branchRepository = manager.getRepository(Branch)
        const branch = await branchRepository.findOneBy({ id: branchId })
        if (!branch)
          throw new Error(
            "The main branch could not be found. Refresh and try again."
          )
        branch.name = branchName
        branch.contactNumber = contactNumber || null
        branch.email = email || null
        branch.address = address || null
        branch.updatedAt = new Date()
        await branchRepository.save(branch)
      }
    })

    revalidatePath("/admin/settings")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/loyalty")
    return { status: "success", message: "System settings saved." }
  } catch (error) {
    console.error("Unable to save system settings:", error)
    return {
      status: "error",
      message:
        error instanceof Error && error.message.startsWith("The main branch")
          ? error.message
          : "Could not save settings. Check the database connection and try again.",
    }
  }
}
