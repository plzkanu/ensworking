"use client";

import { useEffect } from "react";

export type AppDialogType = "success" | "error" | "warning" | "info";

const META: Record<
  AppDialogType,
  { icon: string; iconClass: string; defaultTitle: string }
> = {
  success: {
    icon: "✓",
    iconClass: "bg-[#E8FAF2] text-[#00C471]",
    defaultTitle: "완료",
  },
  error: {
    icon: "!",
    iconClass: "bg-[#FEF0F1] text-[#F04452]",
    defaultTitle: "오류",
  },
  warning: {
    icon: "!",
    iconClass: "bg-[#FFF5E6] text-[#FF9500]",
    defaultTitle: "확인 필요",
  },
  info: {
    icon: "i",
    iconClass: "bg-[#EBF3FE] text-[#3182F6]",
    defaultTitle: "안내",
  },
};

export interface AppDialogProps {
  open: boolean;
  type?: AppDialogType;
  title?: string;
  message: string;
  confirm?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onClose: (confirmed: boolean) => void;
}

export function AppDialog({
  open,
  type = "info",
  title,
  message,
  confirm = false,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onClose,
}: AppDialogProps) {
  const meta = META[type];

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={() => onClose(false)}
      role="presentation"
    >
      <div
        className="app-dialog-panel w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 px-6 pt-6">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${meta.iconClass}`}
          >
            {meta.icon}
          </div>
          <div className="min-w-0 pt-0.5">
            <h3
              id="app-dialog-title"
              className="text-lg font-bold text-slate-900"
            >
              {title || meta.defaultTitle}
            </h3>
          </div>
        </div>
        <div className="whitespace-pre-line px-6 pb-2 pt-4 text-sm leading-6 text-slate-600">
          {message}
        </div>
        <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          {confirm ? (
            <>
              <button
                type="button"
                onClick={() => onClose(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => onClose(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  danger
                    ? "bg-[#C0392B] hover:bg-[#a93226]"
                    : "bg-[#3182F6] hover:bg-[#2563eb]"
                }`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onClose(true)}
              className="rounded-lg bg-[#3182F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
