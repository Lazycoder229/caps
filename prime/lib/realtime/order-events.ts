import "server-only"

type OrderSocketServer = {
  to(room: string): { emit(event: string, payload: { orderId: string }): void }
}

declare global {
  // Set once by server.mjs; Next.js server actions run in the same Node process.
  // eslint-disable-next-line no-var
  var primeOrderSocketServer: OrderSocketServer | undefined
}

export async function publishAdminOrderChange(orderId: string) {
  globalThis.primeOrderSocketServer
    ?.to("admin:orders")
    .emit("orders:changed", { orderId })
}
