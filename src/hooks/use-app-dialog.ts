"use client";

import { useCallback, useState } from "react";
import type { AppDialogProps, AppDialogType } from "@/components/ui/app-dialog";

type DialogRequest = Omit<AppDialogProps, "open" | "onClose">;

interface PendingDialog extends DialogRequest {
  resolve: (confirmed: boolean) => void;
}

export function useAppDialog() {
  const [pending, setPending] = useState<PendingDialog | null>(null);

  const confirm = useCallback((options: DialogRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        type: "warning",
        confirm: true,
        confirmLabel: "확인",
        cancelLabel: "취소",
        ...options,
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    (message: string, options?: Partial<DialogRequest> & { type?: AppDialogType }) => {
      return new Promise<boolean>((resolve) => {
        setPending({
          type: "info",
          message,
          confirm: false,
          confirmLabel: "확인",
          ...options,
          resolve: () => resolve(true),
        });
      });
    },
    [],
  );

  const dialogProps: AppDialogProps = pending
    ? {
        open: true,
        type: pending.type,
        title: pending.title,
        message: pending.message,
        confirm: pending.confirm,
        confirmLabel: pending.confirmLabel,
        cancelLabel: pending.cancelLabel,
        danger: pending.danger,
        onClose: (confirmed) => {
          pending.resolve(confirmed);
          setPending(null);
        },
      }
    : {
        open: false,
        message: "",
        onClose: () => {},
      };

  return { confirm, alert, dialogProps };
}
