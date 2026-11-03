import { redirect } from "next/navigation"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const query = new URLSearchParams()
  if (params.start) query.set("start", params.start)
  if (params.end) query.set("end", params.end)
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ""
  redirect(`/admin/sales${suffix}`)
}
