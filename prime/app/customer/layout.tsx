export const metadata = {
  title: "PRIME Customer",
  description: "Order from PRIME and manage your rewards.",
  manifest: "/customer/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRIME Customer",
  },
  icons: {
    apple: "/apple-icon.png",
  },
}

export default function CustomerRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
