export const metadata = {
  title: "PRIME POS Admin",
  description: "Restaurant operations management",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRIME Admin",
  },
  icons: {
    apple: "/apple-icon.png",
  },
  formatDetection: { telephone: false },
}

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
