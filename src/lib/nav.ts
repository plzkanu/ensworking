export interface NavSubItem {
  href: string;
  label: string;
}

export interface NavItem {
  href?: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  children?: NavSubItem[];
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
    href: "/dashboard/overtime/submissions",
    label: "ERP 제출 내역",
    icon: "📋",
  },
  {
    label: "관리자",
    icon: "⚙️",
    adminOnly: true,
    children: [
      { href: "/dashboard/admin/users", label: "사용자 관리" },
      { href: "/dashboard/admin/roles", label: "역할 관리" },
      { href: "/dashboard/admin/overtime-windows", label: "등록 기간 설정" },
      { href: "/dashboard/admin/erp-submissions", label: "ERP 제출 (전체)" },
      { href: "/dashboard/admin/access-status", label: "접속 현황" },
      { href: "/dashboard/admin/activity-logs", label: "사용 로그" },
    ],
  },
];

export function isAdminNavPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard/admin");
}
