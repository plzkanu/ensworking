export interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "홈", icon: "🏠" },
  {
    href: "/dashboard/overtime/regular",
    label: "시간외근무 (일반)",
    icon: "⏱️",
  },
  {
    href: "/dashboard/overtime/flexible",
    label: "시간외근무 (유연)",
    icon: "🔄",
  },
  {
    href: "/dashboard/admin/users",
    label: "사용자 관리",
    icon: "👥",
    adminOnly: true,
  },
  {
    href: "/dashboard/admin/roles",
    label: "역할 관리",
    icon: "🛡️",
    adminOnly: true,
  },
];
