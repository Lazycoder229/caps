import { AuthSplitLayout } from "@/components/auth-split-layout"
import { CustomerRegisterForm } from "../auth-forms"

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string | string[] }>
}) {
  const query = searchParams ? await searchParams : { returnTo: undefined }
  const returnTo = Array.isArray(query.returnTo)
    ? (query.returnTo[0] ?? "")
    : (query.returnTo ?? "")
  return (
    <AuthSplitLayout
      eyebrow="Customer registration"
      title="Create your account"
      description="Keep your orders, digital receipts, and loyalty points together."
    >
      <CustomerRegisterForm returnTo={returnTo} />
    </AuthSplitLayout>
  )
}
