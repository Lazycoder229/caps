import { getSalesReportData } from "@/lib/sales/report-data"
import { createSalesReportPdf } from "@/lib/sales/report-pdf"
import { createSalesReportExcel } from "@/lib/sales/report-export"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const report = await getSalesReportData(
      {
        start: url.searchParams.get("start") ?? undefined,
        end: url.searchParams.get("end") ?? undefined,
      },
      { includeAllOrders: true }
    )
    const format = url.searchParams.get("format") ?? "pdf"
    const document =
      format === "excel"
        ? createSalesReportExcel(report)
        : format === "pdf"
          ? createSalesReportPdf(report)
          : null
    if (!document)
      return Response.json(
        { message: "Unsupported report format." },
        { status: 400 }
      )
    const body = new ArrayBuffer(document.byteLength)
    new Uint8Array(body).set(document)
    const extension = format === "excel" ? "xlsx" : format
    const contentType =
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="sales-report-${report.range.start}-to-${report.range.end}.${extension}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Unable to export sales report:", error)
    return Response.json(
      { message: "Could not export this sales report. Check the database." },
      { status: 500 }
    )
  }
}
