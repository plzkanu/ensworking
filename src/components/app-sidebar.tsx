"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { mainNavItems } from "@/lib/nav";
import type { SessionUser } from "@/lib/types";

interface AppSidebarProps {
  user: SessionUser;
}

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const items = mainNavItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );
  const initial = user.name.trim().charAt(0) || user.id.charAt(0);

  return (
    <aside className="fixed top-0 left-0 z-[100] flex h-screen w-[220px] flex-col bg-[#0F2645]">
      <div className="border-b border-white/8 px-[18px] pt-5 pb-4">
        <Link
          href="/dashboard"
          className="block rounded-lg bg-white px-3 py-2"
          aria-label="대시보드 홈"
        >
          <span className="text-base font-bold tracking-tight text-[#004b87]">
            SOOSAN
          </span>
        </Link>
        <p className="mt-2 text-[11px] text-[#BCC0C8]">시간외근무 ERP</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-[18px] pt-2 pb-1 text-[10px] font-medium tracking-[0.08em] text-[#BCC0C8] uppercase">
          메뉴
        </p>
        <ul className="px-2">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition ${
                    active
                      ? "bg-[#1E5FD4]/25 font-medium text-white"
                      : "text-white/65 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#1E5FD4]"
                    />
                  ) : null}
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/8 px-[18px] py-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E5FD4] text-xs font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-white/55">
              {user.department ? `${user.department} · ` : ""}
              {user.id}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
