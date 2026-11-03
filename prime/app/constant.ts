import { Fraunces, Manrope } from "next/font/google"
import {
  QrCode,
  RefreshCw,
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

export const groups = [
  {
    label: "Front of house",
    description: "What the guest sees, from the table.",
    items: [
      {
        icon: QrCode,
        title: "QR code table ordering",
        detail:
          "Guests scan a table QR code to open the menu in their browser and place an order.",
      },
      {
        icon: RefreshCw,
        title: "Automatic order refresh",
        detail:
          "The admin order board refreshes every 20 seconds to pick up changes made elsewhere.",
      },
      {
        icon: MonitorSmartphone,
        title: "Order status dashboard",
        detail:
          "Staff can check current order and table statuses in the POS workspace.",
      },
    ],
  },
  {
    label: "Kitchen & counter",
    description: "What keeps the line moving.",
    items: [
      {
        icon: Printer,
        title: "Printer setup preferences",
        detail:
          "Admins can save printer connection details and receipt or kitchen-ticket auto-print preferences.",
      },
      {
        icon: LayoutGrid,
        title: "Dynamic menu management",
        detail:
          "Mark a dish unavailable in the admin menu to remove it from customer ordering.",
      },
      {
        icon: ClipboardList,
        title: "Cashier order entry",
        detail:
          "Cashiers can record walk-in and counter orders in the same POS workspace.",
      },
    ],
  },
  {
    label: "Back office",
    description: "What the owner checks at closing.",
    items: [
      {
        icon: CreditCard,
        title: "Payment & digital receipts",
        detail:
          "Offer the payment methods enabled in store settings and provide digital receipts for eligible orders.",
      },
      {
        icon: History,
        title: "Voids with audit logging",
        detail:
          "Void and cancellation history records the staff involved, reason, status, and resolution details.",
      },
      {
        icon: ShieldCheck,
        title: "Role-based access",
        detail:
          "Admins assign roles and permissions to control which parts of the workspace each staff account can use.",
      },
      {
        icon: BarChart3,
        title: "Sales reporting & analytics",
        detail:
          "Review sales, order, and inventory reports in the admin workspace.",
      },
      {
        icon: Users,
        title: "Employee management",
        detail:
          "Manage employee profiles, attendance, payroll, roles, and permissions from the admin workspace.",
      },
    ],
  },
]

export const steps = [
  {
    n: "01",
    title: "Guest scans the table code",
    detail:
      "The menu opens on their own phone — already set to their table number.",
  },
  {
    n: "02",
    title: "Staff review the order in the POS",
    detail:
      "The order is saved in the system and appears in the staff order workspace, which refreshes periodically.",
  },
  {
    n: "03",
    title: "Staff track order progress",
    detail:
      "Staff can review the order and update its status from the POS order board.",
  },
  {
    n: "04",
    title: "Payment and receipt",
    detail:
      "Payment options depend on store settings; digital receipts are available for eligible customer orders.",
  },
]

export const comparison = [
  {
    before:
      "Orders scribbled on paper get lost between the table and the kitchen.",
    after:
      "Orders are stored in the POS and shown in the staff order workspace.",
  },
  {
    before: "Staff walk the floor to check which tables have been served.",
    after: "Staff can check table and order status from the POS workspace.",
  },
  {
    before: "A menu change means reprinting menus for every table.",
    after:
      "Change menu availability in one place and customer ordering uses the updated menu data.",
  },
  {
    before: "A voided order is just whatever the cashier says happened.",
    after:
      "Void and cancellation history records staff, reason, status, and resolution details.",
  },
  {
    before: "Sales numbers only show up at closing, added up by hand.",
    after: "Admin dashboards and reports summarize sales and order activity.",
  },
]

export const specs = [
  {
    label: "Order updates",
    value:
      "The admin order board refreshes every 20 seconds to check for new changes.",
  },
  {
    label: "Printer settings",
    value:
      "Admins can save printer connection details and receipt or kitchen-ticket auto-print preferences. Actual printing depends on the deployed printer setup.",
  },
  {
    label: "Access control",
    value:
      "Administrators can assign roles and permissions to staff accounts.",
  },
  {
    label: "Audit trail",
    value:
      "Void requests record the staff involved, reason, status, and resolution details.",
  },
  {
    label: "Menu state",
    value:
      "Customer ordering pages read menu availability and pricing from the shared database.",
  },
]

export const faqs = [
  {
    q: "Can I configure our existing printers?",
    a: "The admin workspace can save printer connection details and auto-print preferences. Actual printing depends on the printer integration and deployment setup.",
  },
  {
    q: "What happens if the internet drops mid-shift?",
    a: "PRIME needs access to its application server and database. Offline behavior depends on where those services are hosted and how the restaurant network is configured.",
  },
  {
    q: "Can different staff see different things?",
    a: "Yes. Administrators can assign roles and permissions to control which workspace features staff accounts can access.",
  },
  {
    q: "How are voided orders tracked?",
    a: "Void and cancellation history records the staff involved, reason, status, and resolution details.",
  },
  {
    q: "Is PRIME built for a specific kind of restaurant?",
    a: "PRIME combines QR ordering with cashier, menu, inventory, employee, and reporting workflows. Printer behavior should be confirmed for each deployment.",
  },
]
