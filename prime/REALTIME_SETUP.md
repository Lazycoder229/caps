# Live admin orders on a VPS

The admin order board receives Socket.IO events from the same persistent Node.js process that serves Next.js. Redis is not required for a single app instance. If you run multiple app instances, add a shared Socket.IO adapter such as Redis so events reach sockets connected to every instance.

## Run locally

Use the existing `.env.local` values, then start the app with:

```sh
pnpm dev
```

This runs Next.js and Socket.IO together on port 3000. Admin order updates are pushed to connected staff without polling or a manual refresh.

## Run on the VPS

Build and start the persistent Node server:

```sh
pnpm build
pnpm start
```

Set `NODE_ENV=production` and `PORT` in the process manager. Keep the process running under systemd, PM2, or the VPS provider's Node process manager. Configure the reverse proxy to forward WebSocket upgrade requests for `/socket.io` to this same app process. Keep one app instance unless a shared Socket.IO adapter is configured.

The Socket.IO handshake checks the existing staff session through `/api/admin/realtime-session`; order snapshots continue to use the authenticated `/api/admin/orders/[orderId]` route.
