"use client";

import { useEffect } from "react";
import { ChangePasswordPanel } from "@/components/change-password-panel";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="app-dialog-panel w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <h3
            id="change-password-modal-title"
            className="text-lg font-bold text-[#004b87]"
          >
            비밀번호 변경
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            현재 비밀번호 확인 후 새 비밀번호를 설정할 수 있습니다.
          </p>
        </div>

        <div className="px-6 py-5">
          <ChangePasswordPanel
            key={open ? "open" : "closed"}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
