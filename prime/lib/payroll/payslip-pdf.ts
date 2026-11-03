export type PayslipDocument = {
  restaurantName: string
  branchName: string
  periodStart: string
  periodEnd: string
  employeeName: string
  employeeNumber: string
  position: string
  dailyRate: number
  attendanceDays: number
  paidHours: number
  overtimeHours: number
  grossPay: number
  totalDeductions: number
  netPay: number
  deductions: Array<{
    name: string
    amount: number
    employerAmount: number
  }>
}

const money = (amount: number) =>
  `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function safeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/₱/g, "PHP ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function drawText(
  commands: string[],
  x: number,
  y: number,
  size: number,
  text: string,
  bold = false
) {
  commands.push(
    `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safeText(text)}) Tj ET`
  )
}

function drawLine(
  commands: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  gray = 0.78
) {
  commands.push(
    `${gray} G 0.45 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S 0 G`
  )
}

function drawSlip(
  commands: string[],
  x: number,
  y: number,
  slip: PayslipDocument
) {
  const width = 288
  const height = 288
  const right = x + width
  commands.push(`0.72 G 0.65 w ${x} ${y} ${width} ${height} re S 0 G`)
  drawText(commands, x + 10, y + 269, 10, slip.restaurantName, true)
  drawText(commands, x + 10, y + 257, 7, slip.branchName || "Main Branch")
  drawText(commands, right - 58, y + 269, 8, "PAYSLIP", true)
  drawText(
    commands,
    x + 10,
    y + 242,
    7,
    `Pay period: ${slip.periodStart} to ${slip.periodEnd}`
  )
  drawLine(commands, x + 10, y + 235, right - 10, y + 235)

  drawText(commands, x + 10, y + 220, 9, slip.employeeName, true)
  drawText(
    commands,
    x + 10,
    y + 208,
    7,
    `Employee no.: ${slip.employeeNumber}   Position: ${slip.position}`
  )
  drawText(
    commands,
    x + 10,
    y + 191,
    7,
    `Attendance: ${slip.attendanceDays.toFixed(2)} days  |  Paid: ${slip.paidHours.toFixed(2)} hrs  |  OT: ${slip.overtimeHours.toFixed(2)} hrs`
  )
  drawText(commands, x + 10, y + 179, 7, `Daily rate: ${money(slip.dailyRate)}`)
  drawLine(commands, x + 10, y + 171, right - 10, y + 171)

  drawText(commands, x + 10, y + 157, 8, "GROSS PAY", true)
  drawText(commands, right - 88, y + 157, 8, money(slip.grossPay), true)
  drawText(commands, x + 10, y + 141, 7, "EMPLOYEE DEDUCTIONS", true)

  const employeeDeductions = slip.deductions.filter((item) => item.amount > 0)
  let rowY = y + 129
  for (const item of employeeDeductions.slice(0, 4)) {
    drawText(
      commands,
      x + 10,
      rowY,
      7,
      item.name.replace(/ employee share/i, "")
    )
    drawText(commands, right - 88, rowY, 7, money(item.amount))
    rowY -= 10
  }
  if (employeeDeductions.length > 4) {
    drawText(
      commands,
      x + 10,
      rowY,
      6,
      `+ ${employeeDeductions.length - 4} other deductions`
    )
    rowY -= 10
  }
  drawLine(commands, x + 10, y + 83, right - 10, y + 83)
  drawText(commands, x + 10, y + 71, 7, "Total employee deductions", true)
  drawText(commands, right - 88, y + 71, 7, money(slip.totalDeductions), true)

  drawText(
    commands,
    x + 10,
    y + 56,
    6,
    "EMPLOYER CONTRIBUTIONS (not deducted from pay)",
    true
  )
  let employerY = y + 45
  for (const item of slip.deductions
    .filter((entry) => entry.employerAmount > 0)
    .slice(0, 3)) {
    drawText(
      commands,
      x + 10,
      employerY,
      6,
      item.name.replace(/ employee share/i, "")
    )
    drawText(commands, right - 88, employerY, 6, money(item.employerAmount))
    employerY -= 8
  }

  commands.push(`0.94 g ${x + 7} ${y + 7} ${width - 14} 21 re f 0 g`)
  drawText(commands, x + 12, y + 14, 9, "NET PAY", true)
  drawText(commands, right - 95, y + 14, 9, money(slip.netPay), true)
}

/** Letter/short-bond PDF with four 4 x 4 inch payslip tiles on each page. */
export function createPayslipsPdf(slips: PayslipDocument[]): Uint8Array {
  const pageSlots = [
    [18, 396],
    [306, 396],
    [18, 108],
    [306, 108],
  ] as const
  const pageCount = Math.max(1, Math.ceil(slips.length / pageSlots.length))
  const pageIds = Array.from({ length: pageCount }, (_, index) => 5 + index * 2)
  const objects = new Map<number, string>()
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>")
  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`
  )
  objects.set(
    3,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  )
  objects.set(
    4,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  )

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageId = pageIds[pageIndex]
    const contentId = pageId + 1
    const commands: string[] = []
    for (let slot = 0; slot < pageSlots.length; slot += 1) {
      const slip = slips[pageIndex * pageSlots.length + slot]
      if (slip) drawSlip(commands, pageSlots[slot][0], pageSlots[slot][1], slip)
    }
    const stream = commands.join("\n")
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    )
    objects.set(
      contentId,
      `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`
    )
  }

  const maxId = Math.max(...objects.keys())
  let output = "%PDF-1.4\n"
  const offsets = new Array<number>(maxId + 1).fill(0)
  for (let id = 1; id <= maxId; id += 1) {
    const object = objects.get(id)
    if (!object) continue
    offsets[id] = Buffer.byteLength(output, "ascii")
    output += `${id} 0 obj\n${object}\nendobj\n`
  }
  const xrefOffset = Buffer.byteLength(output, "ascii")
  output += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= maxId; id += 1) {
    output += `${String(offsets[id]).padStart(10, "0")} 00000 ${objects.has(id) ? "n" : "f"} \n`
  }
  output += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Uint8Array(Buffer.from(output, "ascii"))
}
