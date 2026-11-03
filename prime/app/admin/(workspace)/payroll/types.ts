export type PayrollRecordRow = {
  id: string
  employeeName: string
  employeeNumber: string
  position: string
  dailyRate: number
  paidHours: number
  overtimeHours: number
  attendanceDays: number
  grossPay: number
  totalDeductions: number
  netPay: number
  deductions: Array<{
    name: string
    amount: number
    employerAmount: number
    notes: string | null
  }>
}

export type PayrollPeriodRow = {
  id: string
  periodStart: string
  periodEnd: string
  status: string
  records: PayrollRecordRow[]
}
