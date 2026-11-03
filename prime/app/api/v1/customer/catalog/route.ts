import { NextResponse } from "next/server"
import { getKioskCatalog } from "@/app/customer/(portal)/kiosk/data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const tableId = new URL(request.url).searchParams.get("tableId")
    const catalog = await getKioskCatalog(
      tableId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tableId)
        ? tableId
        : null
    )
    return NextResponse.json(catalog, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Failed to load customer mobile catalog:", error)
    return NextResponse.json(
      { error: "Unable to load menu right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
