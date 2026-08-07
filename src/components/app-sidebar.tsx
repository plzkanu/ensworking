"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { LogoutButton } from "@/components/logout-button";
import { AppDialog } from "@/components/ui/app-dialog";
import { useAppDialog } from "@/hooks/use-app-dialog";
import { SoosanLogo } from "@/components/soosan-logo";
import {
  isAdminNavPath,
  isFeedbackNavPath,
  isNavGroupActive,
  mainNavItems,
} from "@/lib/nav";
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

function buildInitialOpenGroups(pathname: string): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  for (const item of mainNavItems) {
    if (!item.children) {
      continue;
    }
    if (item.label === "관리자") {
      open[item.label] = isAdminNavPath(pathname);
    } else if (item.label === "프로그램 의견 접수") {
      open[item.label] = isFeedbackNavPath(pathname);
    } else {
      open[item.label] = isNavGroupActive(pathname, item);
    }
  }
  return open;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const items = mainNavItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );
  const initial = user.name.trim().charAt(0) || user.id.charAt(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    buildInitialOpenGroups(pathname),
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { alert, dialogProps } = useAppDialog();

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const item of mainNavItems) {
        if (!item.children) {
          continue;
        }
        if (isNavGroupActive(pathname, item)) {
          next[item.label] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <>
    <AppDialog {...dialogProps} />
    <ChangePasswordModal
      open={passwordModalOpen}
      onClose={() => setPasswordModalOpen(false)}
      onSuccess={() =>
        void alert("비밀번호가 변경되었습니다.", {
          type: "success",
          title: "변경 완료",
        })
      }
    />
    <aside className="fixed top-0 left-0 z-[100] flex h-screen w-[220px] flex-col bg-[#0F2645]">
      <div className="border-b border-white/8 px-4 pt-5 pb-4">
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center rounded-lg bg-white px-3 py-3"
          aria-label="대시보드 홈"
        >
          <SoosanLogo variant="sidebar" height={26} />
        </Link>
        <p className="mt-2 text-center text-[11px] text-[#BCC0C8]">시간외근무 ERP</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-[18px] pt-2 pb-1 text-[10px] font-medium tracking-[0.08em] text-[#BCC0C8] uppercase">
          메뉴
        </p>
        <ul className="px-2">
          {items.map((item) => {
            if (item.children) {
              const groupActive = isNavGroupActive(pathname, item);
              const isOpen = openGroups[item.label] ?? false;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={`relative mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition ${
                      groupActive
                        ? "bg-[#1E5FD4]/25 font-medium text-white"
                        : "text-white/65 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    {groupActive ? (
                      <span
                        aria-hidden
                        className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#1E5FD4]"
                      />
                    ) : null}
                    <span aria-hidden>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <span
                      aria-hidden
                      className={`text-[10px] transition ${isOpen ? "rotate-90" : ""}`}
                    >
                      ▶
                    </span>
                  </button>
                  {isOpen ? (
                    <ul className="mb-1 ml-3 border-l border-white/10 pl-2">
                      {item.children.map((child) => {
                        const active = isNavActive(pathname, child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`mb-0.5 block rounded-lg px-3 py-2 text-[12px] transition ${
                                active
                                  ? "bg-[#1E5FD4]/20 font-medium text-white"
                                  : "text-white/55 hover:bg-white/6 hover:text-white"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            }

            const active = isNavActive(pathname, item.href!);
            return (
              <li key={item.href}>
                <Link
                  href={item.href!}
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
        <div ref={userMenuRef} className="relative mb-3">
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition ${
              userMenuOpen
                ? "bg-white/10"
                : "hover:bg-white/6"
            }`}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E5FD4] text-xs font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-white/55">
                {user.department ? `${user.department} · ` : ""}
                {user.id}
              </p>
            </div>
            <span
              aria-hidden
              className={`shrink-0 text-[10px] text-white/45 transition ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>
          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 bottom-full left-0 mb-1 overflow-hidden rounded-lg border border-white/10 bg-[#152a4a] shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="block w-full px-3 py-2.5 text-left text-[12px] text-white/85 transition hover:bg-white/8 hover:text-white"
              >
                비밀번호 변경
              </button>
            </div>
          ) : null}
        </div>
        <LogoutButton />
      </div>
    </aside>
    </>
  );
}
