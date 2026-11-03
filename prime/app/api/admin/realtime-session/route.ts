import { getStaffSession } from "@/lib/staff-auth/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const staff = await getStaffSession()
  const isAdmin = /^(admin|administrator)$/i.test(staff?.roleName.trim() ?? "")
  if (!staff || (!isAdmin && !staff.permissionCodes.includes("orders:view")))
    return new Response(null, { status: 403 })
  return new Response(null, { status: 204 })
}
