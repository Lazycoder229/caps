import { Fraunces, Manrope } from "next/font/google"
import {
  QrCode,
  Wifi,
  MonitorSmartphone,
  Printer,
  LayoutGrid,
  ClipboardList,
  CreditCard,
  History,
  ShieldCheck,
  BarChart3,
  Users,
} from "lucide-react"

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
})
