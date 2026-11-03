export const ACCESS_PERMISSION_GROUPS = [
  {
    module: "Dashboard",
    permissions: [
      { code: "dashboard:view", description: "View the admin dashboard." },
    ],
  },
  {
    module: "Live orders",
    permissions: [
      { code: "orders:view", description: "View live and historical orders." },
      { code: "orders:create", description: "Create POS orders." },
      {
        code: "orders:update",
        description: "Update order status and details.",
      },
      { code: "orders:cancel", description: "Cancel or void orders." },
    ],
  },
  {
    module: "Tables & reservations",
    permissions: [
      { code: "tables:manage", description: "Manage tables and QR codes." },
      { code: "reservations:manage", description: "Manage reservations." },
    ],
  },
  {
    module: "Menu & discounts",
    permissions: [
      { code: "menu:manage", description: "Manage menu items and categories." },
      {
        code: "discounts:manage",
        description: "Manage discounts and promotions.",
      },
    ],
  },
  {
    module: "Inventory",
    permissions: [
      {
        code: "inventory:manage",
        description: "Manage ingredients and stock.",
      },
    ],
  },
  {
    module: "People",
    permissions: [
      {
        code: "employees:manage",
        description: "Manage staff accounts and employee records.",
      },
      {
        code: "roles:manage",
        description: "Manage roles and permission assignments.",
      },
      { code: "attendance:manage", description: "Manage staff attendance." },
      { code: "payroll:manage", description: "Manage payroll records." },
    ],
  },
  {
    module: "Administration",
    permissions: [
      { code: "voids:approve", description: "Review and approve order voids." },
      { code: "settings:manage", description: "Change system settings." },
      {
        code: "reports:view",
        description: "View sales reports and analytics.",
      },
      {
        code: "loyalty:manage",
        description: "Manage loyalty and point redemptions.",
      },
      {
        code: "printers:manage",
        description: "Manage receipt and kitchen printers.",
      },
    ],
  },
] as const

export const ACCESS_PERMISSIONS = ACCESS_PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => ({
    ...permission,
    module: group.module,
  }))
)

export type AccessPermission = (typeof ACCESS_PERMISSIONS)[number]
