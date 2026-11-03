import type { SalesReportData } from "./report-data"

type ExportSheet = {
  name: string
  columns: string[]
  rows: Array<Array<string | number>>
  currencyColumns?: number[]
  currencyRows?: number[]
}

function reportSheets(report: SalesReportData): ExportSheet[] {
  return [
    {
      name: "Summary",
      columns: ["Metric", "Value"],
      currencyRows: [1, 3, 4, 5, 6],
      rows: [
        ["Report period", `${report.range.start} to ${report.range.end}`],
        ["Completed sales", report.summary.sales],
        ["Completed orders", report.summary.orders],
        ["Average order", report.summary.averageOrder],
        ["Discounts applied", report.summary.discounts],
        ["Tax recorded", report.summary.tax],
        ["Payments collected", report.summary.paymentsCollected],
      ],
    },
    {
      name: "Daily sales",
      columns: ["Date", "Orders", "Sales"],
      currencyColumns: [2],
      rows: report.daily.map((day) => [day.date, day.orders, day.sales]),
    },
    {
      name: "Top menu items",
      columns: ["Menu item", "Quantity sold", "Sales"],
      currencyColumns: [2],
      rows: report.topItems.map((item) => [
        item.name,
        item.quantity,
        item.sales,
      ]),
    },
    {
      name: "Payments",
      columns: ["Payment method", "Payment count", "Amount collected"],
      currencyColumns: [2],
      rows: report.payments.map((payment) => [
        payment.method.toUpperCase(),
        payment.count,
        payment.amount,
      ]),
    },
    {
      name: "Order status",
      columns: ["Status", "Orders"],
      rows: report.statuses.map((status) => [status.status, status.count]),
    },
    {
      name: "Order details",
      columns: [
        "Order number",
        "Date and time",
        "Order type",
        "Table",
        "Status",
        "Payment method",
        "Discount",
        "Tax",
        "Total",
      ],
      currencyColumns: [6, 7, 8],
      rows: report.recentOrders.map((order) => [
        order.orderNumber,
        order.createdAt.replace("T", " ").slice(0, 16),
        order.orderType,
        order.tableNumber ?? "—",
        order.status,
        order.paymentMethod ?? order.paymentStatus.replaceAll("_", " "),
        order.discount,
        order.tax,
        order.total,
      ]),
    },
  ]
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function columnName(index: number) {
  let value = index + 1
  let name = ""
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function worksheetXml(report: SalesReportData, sheet: ExportSheet) {
  const info = [
    report.restaurant.branch,
    report.restaurant.address,
    [report.restaurant.contactNumber, report.restaurant.email]
      .filter(Boolean)
      .join(" · "),
    report.restaurant.tin ? `TIN: ${report.restaurant.tin}` : "",
    `Report period: ${report.range.start} to ${report.range.end}`,
  ].filter(Boolean)
  const headerRow = info.length + 3
  const lastColumn = columnName(sheet.columns.length - 1)
  const lastRow = headerRow + sheet.rows.length
  const rows = [
    `<row r="1" ht="25" customHeight="1"><c r="A1" s="1" t="inlineStr"><is><t>${xmlEscape(report.restaurant.name)}</t></is></c></row>`,
    ...info.map((line, index) => {
      const rowNumber = index + 2
      return `<row r="${rowNumber}"><c r="A${rowNumber}" s="2" t="inlineStr"><is><t>${xmlEscape(line)}</t></is></c></row>`
    }),
    `<row r="${headerRow - 1}"/>`,
    `<row r="${headerRow}">${sheet.columns
      .map(
        (column, index) =>
          `<c r="${columnName(index)}${headerRow}" s="3" t="inlineStr"><is><t>${xmlEscape(column)}</t></is></c>`
      )
      .join("")}</row>`,
    ...sheet.rows.map((row, rowIndex) => {
      const rowNumber = headerRow + rowIndex + 1
      return `<row r="${rowNumber}">${row
        .map((value, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowNumber}`
          return typeof value === "number"
            ? `<c r="${ref}"${sheet.currencyColumns?.includes(columnIndex) || sheet.currencyRows?.includes(rowIndex) ? ' s="4"' : ""}><v>${Number.isFinite(value) ? value : 0}</v></c>`
            : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`
        })
        .join("")}</row>`
    }),
  ].join("")
  const filter = sheet.rows.length
    ? `<autoFilter ref="A${headerRow}:${lastColumn}${lastRow}"/>`
    : ""
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>${rows}</sheetData><mergeCells count="${1 + info.length}"><mergeCell ref="A1:${lastColumn}1"/>${info.map((_, index) => `<mergeCell ref="A${index + 2}:${lastColumn}${index + 2}"/>`).join("")}</mergeCells>${filter}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`
}

function crc32(data: Buffer) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function zipFiles(files: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let localOffset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8")
    const content = Buffer.from(file.content, "utf8")
    const checksum = crc32(content)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0x0021, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(content.length, 18)
    local.writeUInt32LE(content.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, name, content)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0x0021, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(content.length, 20)
    central.writeUInt32LE(content.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(localOffset, 42)
    centralParts.push(central, name)
    localOffset += local.length + name.length + content.length
  }
  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(localOffset, 16)
  end.writeUInt16LE(0, 20)
  return new Uint8Array(Buffer.concat([...localParts, centralDirectory, end]))
}

export function createSalesReportExcel(report: SalesReportData) {
  const sheets = reportSheets(report)
  const worksheetFiles = sheets.map((sheet, index) => ({
    name: `xl/worksheets/sheet${index + 1}.xml`,
    content: worksheetXml(report, sheet),
  }))
  const sheetEntries = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("")
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`
  const workbookRelationships = `${sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
    )
    .join(
      ""
    )}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
  const contentTypes = `${sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join(
      ""
    )}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
  return zipFiles([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${contentTypes}</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    { name: "xl/workbook.xml", content: workbook },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRelationships}</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;[Red]-#,##0.00"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FF111827"/><name val="Aptos Display"/></font><font><sz val="10"/><color rgb="FF4B5563"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    },
    ...worksheetFiles,
  ])
}
