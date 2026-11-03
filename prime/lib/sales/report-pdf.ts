import type { SalesReportData } from "./report-data"

const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const LEFT = 36
const TABLE_WIDTH = PAGE_WIDTH - LEFT * 2

type Column = { label: string; width: number; align?: "left" | "right" }

function safeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

const money = (value: number) =>
  `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function pageContent(pages: string[][]) {
  const pageIds = pages.map((_, index) => 5 + index * 2)
  const objects = new Map<number, string>([
    [1, "<< /Type /Catalog /Pages 2 0 R >>"],
    [
      2,
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
    ],
    [
      3,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ],
    [
      4,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ],
  ])
  pages.forEach((commands, index) => {
    const pageId = pageIds[index]
    const contentId = pageId + 1
    const footer = `BT /F1 8 Tf 1 0 0 1 720 20 Tm (${index + 1} / ${pages.length}) Tj ET`
    const stream = [...commands, footer].join("\n")
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    )
    objects.set(
      contentId,
      `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`
    )
  })
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

/** Creates a landscape PDF report with a settings-based business header and tabular sections. */
export function createSalesReportPdf(report: SalesReportData): Uint8Array {
  const pages: string[][] = [[]]
  let y = PAGE_HEIGHT - 36
  const text = (
    value: string,
    x: number,
    baseline: number,
    size = 9,
    bold = false
  ) => {
    pages
      .at(-1)!
      .push(
        `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${baseline} Tm (${safeText(value)}) Tj ET`
      )
  }
  const newPage = () => {
    pages.push([])
    y = PAGE_HEIGHT - 42
    text("Sales & Operations Report (continued)", LEFT, y, 13, true)
    y -= 18
    text(`${report.range.start} to ${report.range.end}`, LEFT, y, 9)
    y -= 20
  }
  const ensureSpace = (height: number) => {
    if (y - height < 42) newPage()
  }
  const drawTable = (
    title: string,
    columns: Column[],
    rows: Array<Array<string | number>>
  ) => {
    const drawSectionHeading = (continued = false) => {
      ensureSpace(48)
      text(`${title}${continued ? " (continued)" : ""}`, LEFT, y, 12, true)
      y -= 17
    }
    const drawColumnHeader = () => {
      const bottom = y - 14
      pages
        .at(-1)!
        .push(`q 0.12 0.16 0.21 rg ${LEFT} ${bottom} ${TABLE_WIDTH} 20 re f Q`)
      let x = LEFT + 6
      for (const column of columns) {
        text(column.label, x, bottom + 6, 8, true)
        x += column.width
      }
      y -= 20
    }
    const drawRow = (row: Array<string | number>, rowIndex: number) => {
      const bottom = y - 14
      if (rowIndex % 2 === 1)
        pages
          .at(-1)!
          .push(
            `q 0.96 0.97 0.98 rg ${LEFT} ${bottom} ${TABLE_WIDTH} 18 re f Q`
          )
      pages
        .at(-1)!
        .push(
          `q 0.82 0.84 0.87 RG 0.4 w ${LEFT} ${bottom} m ${LEFT + TABLE_WIDTH} ${bottom} l S Q`
        )
      let x = LEFT + 6
      row.forEach((rawValue, columnIndex) => {
        const column = columns[columnIndex]
        const value = String(rawValue)
        const charLimit = Math.max(4, Math.floor((column.width - 10) / 4.4))
        const clipped =
          value.length > charLimit
            ? `${value.slice(0, Math.max(1, charLimit - 3))}...`
            : value
        const textWidth = clipped.length * 4.2
        const textX =
          column.align === "right" ? x + column.width - textWidth - 8 : x
        text(clipped, textX, bottom + 6, 8)
        x += column.width
      })
      y -= 18
    }

    drawSectionHeading()
    drawColumnHeader()
    rows.forEach((row, index) => {
      if (y - 18 < 42) {
        newPage()
        drawSectionHeading(true)
        drawColumnHeader()
      }
      drawRow(row, index)
    })
    y -= 18
  }

  text("Sales & Operations Report", LEFT, y, 17, true)
  y -= 22
  text(report.restaurant.name, LEFT, y, 12, true)
  y -= 15
  for (const detail of [
    report.restaurant.branch,
    report.restaurant.address,
    [report.restaurant.contactNumber, report.restaurant.email]
      .filter(Boolean)
      .join("  |  "),
    report.restaurant.tin ? `TIN: ${report.restaurant.tin}` : "",
  ].filter(Boolean)) {
    const maxLength = 132
    for (let start = 0; start < detail.length; start += maxLength) {
      text(detail.slice(start, start + maxLength), LEFT, y, 8)
      y -= 11
    }
  }
  y -= 2
  text(
    `Report period: ${report.range.start} to ${report.range.end}`,
    LEFT,
    y,
    9,
    true
  )
  y -= 23

  drawTable(
    "Sales summary",
    [
      { label: "Metric", width: 560 },
      { label: "Value", width: 160, align: "right" },
    ],
    [
      ["Completed sales", money(report.summary.sales)],
      ["Completed orders", report.summary.orders.toLocaleString("en-PH")],
      ["Average order", money(report.summary.averageOrder)],
      ["Discounts applied", money(report.summary.discounts)],
      ["Tax recorded", money(report.summary.tax)],
      ["Payments collected", money(report.summary.paymentsCollected)],
    ]
  )
  drawTable(
    "Daily sales",
    [
      { label: "Date", width: 450 },
      { label: "Orders", width: 110, align: "right" },
      { label: "Sales", width: 160, align: "right" },
    ],
    report.daily.map((day) => [day.date, day.orders, money(day.sales)])
  )
  drawTable(
    "Top menu items",
    [
      { label: "Menu item", width: 420 },
      { label: "Quantity sold", width: 130, align: "right" },
      { label: "Sales", width: 170, align: "right" },
    ],
    report.topItems.map((item) => [item.name, item.quantity, money(item.sales)])
  )
  drawTable(
    "Payments by method",
    [
      { label: "Payment method", width: 430 },
      { label: "Payments", width: 130, align: "right" },
      { label: "Amount", width: 160, align: "right" },
    ],
    report.payments.map((payment) => [
      payment.method.toUpperCase(),
      payment.count,
      money(payment.amount),
    ])
  )
  drawTable(
    "Order status",
    [
      { label: "Status", width: 600 },
      { label: "Orders", width: 120, align: "right" },
    ],
    report.statuses.map((status) => [status.status, status.count])
  )
  drawTable(
    "Order details",
    [
      { label: "Order", width: 86 },
      { label: "Date/time", width: 105 },
      { label: "Type", width: 65 },
      { label: "Table", width: 48 },
      { label: "Status", width: 65 },
      { label: "Payment", width: 88 },
      { label: "Discount", width: 85, align: "right" },
      { label: "Tax", width: 75, align: "right" },
      { label: "Total", width: 103, align: "right" },
    ],
    report.recentOrders.map((order) => [
      order.orderNumber,
      new Intl.DateTimeFormat("en-PH", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date(order.createdAt)),
      order.orderType,
      order.tableNumber ?? "—",
      order.status,
      order.paymentMethod ?? order.paymentStatus.replaceAll("_", " "),
      money(order.discount),
      money(order.tax),
      money(order.total),
    ])
  )

  return pageContent(pages)
}
