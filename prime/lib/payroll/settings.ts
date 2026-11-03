export type PayrollCalculationSettings = {
  payrollDutyHours: number
  payrollUnpaidBreakHours: number
  payrollWorkdaysPerMonth: number
  payrollOvertimeMultiplier: number
  payrollSssEmployeeShare: number
  payrollSssEmployerShare: number
  payrollPhilhealthEmployeeShare: number
  payrollPhilhealthEmployerShare: number
  payrollPagibigEmployeeShare: number
  payrollPagibigEmployerShare: number
  payrollMealsDeduction: number
}

export const defaultPayrollCalculationSettings: PayrollCalculationSettings = {
  payrollDutyHours: 8,
  payrollUnpaidBreakHours: 1,
  payrollWorkdaysPerMonth: 26,
  payrollOvertimeMultiplier: 1.25,
  payrollSssEmployeeShare: 0,
  payrollSssEmployerShare: 255,
  payrollPhilhealthEmployeeShare: 0,
  payrollPhilhealthEmployerShare: 125,
  payrollPagibigEmployeeShare: 0,
  payrollPagibigEmployerShare: 4.5,
  payrollMealsDeduction: 0,
}

export function readPayrollCalculationSettings(
  value?: Partial<PayrollCalculationSettings> | null
): PayrollCalculationSettings {
  return {
    payrollDutyHours: Number(
      value?.payrollDutyHours ??
        defaultPayrollCalculationSettings.payrollDutyHours
    ),
    payrollUnpaidBreakHours: Number(
      value?.payrollUnpaidBreakHours ??
        defaultPayrollCalculationSettings.payrollUnpaidBreakHours
    ),
    payrollWorkdaysPerMonth: Number(
      value?.payrollWorkdaysPerMonth ??
        defaultPayrollCalculationSettings.payrollWorkdaysPerMonth
    ),
    payrollOvertimeMultiplier: Number(
      value?.payrollOvertimeMultiplier ??
        defaultPayrollCalculationSettings.payrollOvertimeMultiplier
    ),
    payrollSssEmployeeShare: Number(
      value?.payrollSssEmployeeShare ??
        defaultPayrollCalculationSettings.payrollSssEmployeeShare
    ),
    payrollSssEmployerShare: Number(
      value?.payrollSssEmployerShare ??
        defaultPayrollCalculationSettings.payrollSssEmployerShare
    ),
    payrollPhilhealthEmployeeShare: Number(
      value?.payrollPhilhealthEmployeeShare ??
        defaultPayrollCalculationSettings.payrollPhilhealthEmployeeShare
    ),
    payrollPhilhealthEmployerShare: Number(
      value?.payrollPhilhealthEmployerShare ??
        defaultPayrollCalculationSettings.payrollPhilhealthEmployerShare
    ),
    payrollPagibigEmployeeShare: Number(
      value?.payrollPagibigEmployeeShare ??
        defaultPayrollCalculationSettings.payrollPagibigEmployeeShare
    ),
    payrollPagibigEmployerShare: Number(
      value?.payrollPagibigEmployerShare ??
        defaultPayrollCalculationSettings.payrollPagibigEmployerShare
    ),
    payrollMealsDeduction: Number(
      value?.payrollMealsDeduction ??
        defaultPayrollCalculationSettings.payrollMealsDeduction
    ),
  }
}
