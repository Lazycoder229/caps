import { GET as downloadSalesReport } from "@/app/admin/(workspace)/reports/download/route"

export async function GET(request: Request) {
  return await downloadSalesReport(request)
}
