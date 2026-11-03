import QRCode from "qrcode"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { RestaurantTable } from "@/lib/database/entities/entities/RestaurantTable"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params

  try {
    const source = await getInitializedDataSource()
    const tableExists = await source
      .getRepository(RestaurantTable)
      .existsBy({ id: tableId })
    if (!tableExists)
      return Response.json({ message: "Table not found." }, { status: 404 })

    const orderUrl = new URL("/customer/kiosk", request.url)
    orderUrl.searchParams.set("tableId", tableId)
    const png = await QRCode.toBuffer(orderUrl.toString(), {
      type: "png",
      width: 800,
      margin: 2,
      errorCorrectionLevel: "M",
    })

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Disposition": `inline; filename="table-${tableId}-qr.png"`,
      },
    })
  } catch (error) {
    console.error("Unable to generate table QR code:", error)
    return Response.json(
      { message: "Could not generate the table QR code." },
      { status: 500 }
    )
  }
}
