import { redirect } from "next/navigation"
export default async function CustomerRootPage() {
  redirect("/customer/dashboard")
}
