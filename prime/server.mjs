import { createServer } from "node:http"
import next from "next"
import { Server } from "socket.io"

const dev = process.argv.includes("--dev")
const hostname = process.env.HOST ?? "0.0.0.0"
const port = Number(process.env.PORT ?? 3000)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

const httpServer = createServer((request, response) => handle(request, response))
const io = new Server(httpServer, {
  path: "/socket.io",
  transports: ["websocket"],
  serveClient: false,
})

globalThis.primeOrderSocketServer = io

io.use(async (socket, next) => {
  try {
    const appOrigin =
      process.env.INTERNAL_APP_URL ?? `http://127.0.0.1:${port}`
    const response = await fetch(
      new URL("/api/admin/realtime-session", appOrigin),
      {
        headers: { cookie: socket.request.headers.cookie ?? "" },
        cache: "no-store",
      }
    )
    if (!response.ok) return next(new Error("Staff order access is required."))
    socket.join("admin:orders")
    next()
  } catch (error) {
    console.error("Socket.IO authentication failed:", error)
    next(new Error("Realtime authentication failed."))
  }
})

httpServer.listen(port, hostname, () => {
  console.log(`> Prime app and Socket.IO listening on http://${hostname}:${port}`)
})
