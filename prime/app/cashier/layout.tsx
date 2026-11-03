export const metadata = {
  title: "PRIME Cashier",
  description: "Checkout and live order management for PRIME.",
  manifest: "/cashier/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRIME Cashier",
  },
  icons: {
    apple: "/apple-icon.png",
  },
}

export default function CashierRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
