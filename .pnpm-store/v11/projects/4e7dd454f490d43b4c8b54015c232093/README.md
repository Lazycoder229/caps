# PRIME Customer mobile app

Expo React Native app for the customer experience. It uses the Next.js API in this repository.

## Backend URL for Android APKs

The API URL is embedded into the JavaScript bundle when the app is built. The
`10.0.2.2` fallback is only for an Android emulator; it does not work on a
physical phone. For an APK installed on a phone, set
`EXPO_PUBLIC_API_URL` to a URL the phone can reach before building. For local
testing, use the development computer's LAN IPv4 address, such as
`http://192.168.1.25:3000`. Both devices must be on the same Wi-Fi, the backend
must listen on `0.0.0.0`, and the computer firewall must allow inbound TCP port
3000. For an APK used outside that network, use the backend's public HTTPS URL.

The EAS `preview` APK profile is configured to use the deployed backend at
`https://caps-eosin-one.vercel.app`. Build from `mobile`:

```bash
pnpm exec eas build --platform android --profile preview
```

Changing the URL requires a new APK build and reinstall; restarting the backend
or updating the app over the air does not change the URL already bundled into an
APK. Do not ship an APK with the emulator fallback.

## Run locally

1. Start the Next.js backend from `finalboss/prime` with `pnpm dev -- --hostname 0.0.0.0`.
2. Set `EXPO_PUBLIC_API_URL` before starting Expo:
   - Android emulator: `http://10.0.2.2:3000`
   - Physical phone on the same Wi-Fi: `http://<your-computer-LAN-IP>:3000`
   - iOS simulator: `http://localhost:3000` (requires macOS)
3. From `finalboss/mobile`, install dependencies with `pnpm install` once, then start the app with `pnpm start -- --lan` and scan the QR code with Expo Go.

For Expo Go on a physical phone, create `.env.local` in `finalboss/mobile` with the LAN URL, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Allow inbound connections to port 3000 on the computer firewall when testing over Wi-Fi. Restart Expo after changing the environment file.

The first mobile slice includes customer registration/sign-in, a secure saved bearer token, session restoration, sign-out, and the live menu catalog. The customer PWA continues to use its existing routes and Server Actions.
