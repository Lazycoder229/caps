import { notFound } from "next/navigation"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Order } from "@/lib/database/entities/entities/Order"
import { CustomerReferenceForm } from "./reference-form"

export const dynamic = "force-dynamic"

export async function PaymentReferenceContent({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound()
  const source = await getInitializedDataSource()
  const order = await source.getRepository(Order).findOneBy({
    paymentReferenceToken: token,
  })
  if (
    !order ||
    order.adminHiddenAt ||
    !order.paymentMethod ||
    !["gcash", "maya", "qrph"].includes(order.paymentMethod)
  )
    notFound()

  const closed =
    order.paymentStatus !== "pending" || order.status === "cancelled"
  return (
    <main className="mx-auto grid min-h-screen max-w-lg content-center gap-5 p-5">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Payment reference
        </p>
        <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
        <p className="text-sm text-muted-foreground">
          Total: ₱
          {Number(order.total).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })}{" "}
          · {order.paymentMethod.toUpperCase()}
        </p>
      </header>
      {closed ? (
        <div className="rounded-lg border p-4 text-sm">
          {order.paymentStatus === "paid"
            ? "Payment has been confirmed. Thank you!"
            : "This order is no longer awaiting payment."}
        </div>
      ) : (
        <CustomerReferenceForm
          token={token}
          savedReference={order.customerPaymentReference}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Submit the transaction reference shown by your payment app after sending
        payment. Staff will verify it before the order starts.
      </p>
    </main>
  )
}

export default PaymentReferenceContent
