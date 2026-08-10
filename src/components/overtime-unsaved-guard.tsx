"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppDialog } from "@/components/ui/app-dialog";
import { useAppDialog } from "@/hooks/use-app-dialog";
import {
  getOvertimeUnsaved,
  registerOvertimeLeaveConfirm,
  setOvertimeUnsaved,
} from "@/lib/overtime-unsaved";

function isInternalNavHref(href: string, pathname: string) {
  if (!href || href.startsWith("#") || href.startsWith("http")) return false;
  if (href === pathname) return false;
  return true;
}

export function OvertimeUnsavedGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { confirm, dialogProps } = useAppDialog();

  useEffect(() => {
    registerOvertimeLeaveConfirm(confirm);
    return () => registerOvertimeLeaveConfirm(null);
  }, [confirm]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "overtime-unsaved") return;
      setOvertimeUnsaved(!!event.data.dirty);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/dashboard/overtime")) {
      setOvertimeUnsaved(false);
    }
  }, [pathname]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!getOvertimeUnsaved()) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!getOvertimeUnsaved()) return;

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalNavHref(href, pathname)) return;

      event.preventDefault();
      event.stopPropagation();

      void confirm({
        type: "warning",
        title: "ERP 미저장 데이터",
        message:
          "목록에 ERP에 저장하지 않은 데이터가 있습니다.\n" +
          "이 페이지를 벗어나면 입력 내용이 사라집니다.\n" +
          "계속 진행하시겠습니까?",
        confirmLabel: "계속",
        cancelLabel: "머무르기",
        danger: true,
      }).then((ok) => {
        if (!ok) return;
        setOvertimeUnsaved(false);
        router.push(href);
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [confirm, pathname, router]);

  return <AppDialog {...dialogProps} />;
}
