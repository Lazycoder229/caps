# PRIME Customer mobile app

Expo React Native app for the customer experience. It uses the Next.js API in this repository.

## Run locally

1. Start the Next.js backend from `finalboss/prime` with `pnpm dev -- --hostname 0.0.0.0`.
2. Set `EXPO_PUBLIC_API_URL` before starting Expo:
   - Android emulator: `http://10.0.2.2:3000`
   - Physical phone on the same Wi-Fi: `http://<your-computer-LAN-IP>:3000`
   - iOS simulator: `http://localhost:3000` (requires macOS)
3. From `finalboss/mobile`, install dependencies with `pnpm install` once, then start the app with `pnpm start -- --lan` and scan the QR code with Expo Go.

For a physical phone, create `.env.local` in `finalboss/mobile` with the LAN URL, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Allow inbound connections to port 3000 on the computer firewall when testing over Wi-Fi. Restart Expo after changing the environment file.

The first mobile slice includes customer registration/sign-in, a secure saved bearer token, session restoration, sign-out, and the live menu catalog. The customer PWA continues to use its existing routes and Server Actions.
