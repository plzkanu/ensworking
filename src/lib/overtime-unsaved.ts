type LeaveConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type LeaveConfirmFn = (options: LeaveConfirmOptions) => Promise<boolean>;

let dirty = false;
let confirmLeave: LeaveConfirmFn | null = null;
const listeners = new Set<(value: boolean) => void>();

export function setOvertimeUnsaved(value: boolean) {
  if (dirty === value) return;
  dirty = value;
  listeners.forEach((listener) => listener(value));
}

export function getOvertimeUnsaved() {
  return dirty;
}

export function subscribeOvertimeUnsaved(listener: (value: boolean) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerOvertimeLeaveConfirm(fn: LeaveConfirmFn | null) {
  confirmLeave = fn;
}

export async function ensureCanLeaveOvertime(): Promise<boolean> {
  if (!dirty) return true;

  const message =
    "목록에 ERP에 저장하지 않은 데이터가 있습니다.\n" +
    "이 페이지를 벗어나면 입력 내용이 사라집니다.\n" +
    "계속 진행하시겠습니까?";

  const ok = confirmLeave
    ? await confirmLeave({
        title: "ERP 미저장 데이터",
        message,
        confirmLabel: "계속",
        cancelLabel: "머무르기",
        danger: true,
      })
    : window.confirm(message);

  if (ok) setOvertimeUnsaved(false);
  return ok;
}
