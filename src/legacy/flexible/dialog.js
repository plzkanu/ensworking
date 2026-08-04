/* ══════════════════════════════════════════════════════════════════
   앱 공통 알림/확인 다이얼로그 (alert / confirm 대체)
══════════════════════════════════════════════════════════════════ */
const APP_DIALOG_META = {
  success: { icon: "✓", color: "var(--green)", bg: "var(--green-bg)", title: "완료" },
  error: { icon: "!", color: "var(--red)", bg: "var(--red-bg)", title: "오류" },
  warning: { icon: "!", color: "var(--orange)", bg: "var(--orange-bg)", title: "확인 필요" },
  info: { icon: "i", color: "var(--blue)", bg: "var(--blue-bg)", title: "안내" },
};

let _dialogResolve = null;
let _dialogKeyHandler = null;

function closeAppDialog(result) {
  const el = document.getElementById("appDialog");
  if (el) el.style.display = "none";
  if (_dialogKeyHandler) {
    document.removeEventListener("keydown", _dialogKeyHandler);
    _dialogKeyHandler = null;
  }
  if (_dialogResolve) {
    const fn = _dialogResolve;
    _dialogResolve = null;
    fn(result);
  }
}

function showAppDialog(options) {
  return new Promise((resolve) => {
    const type = options.type || "info";
    const meta = APP_DIALOG_META[type] || APP_DIALOG_META.info;
    const modal = document.getElementById("appDialog");
    const iconEl = document.getElementById("appDialogIcon");
    const titleEl = document.getElementById("appDialogTitle");
    const msgEl = document.getElementById("appDialogMessage");
    const actionsEl = document.getElementById("appDialogActions");

    if (!modal || !iconEl || !titleEl || !msgEl || !actionsEl) {
      resolve(options.confirm ? window.confirm(String(options.message || "")) : (window.alert(String(options.message || "")), true));
      return;
    }

    iconEl.textContent = options.icon || meta.icon;
    iconEl.style.background = meta.bg;
    iconEl.style.color = meta.color;
    titleEl.textContent = options.title || meta.title;
    msgEl.textContent = options.message || "";

    actionsEl.innerHTML = "";
    _dialogResolve = resolve;

    if (options.confirm) {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "app-dialog-btn app-dialog-btn-secondary";
      cancelBtn.textContent = options.cancelLabel || "취소";
      cancelBtn.onclick = () => closeAppDialog(false);

      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "app-dialog-btn " + (options.danger ? "app-dialog-btn-danger" : "app-dialog-btn-primary");
      okBtn.textContent = options.confirmLabel || "확인";
      okBtn.onclick = () => closeAppDialog(true);

      actionsEl.appendChild(cancelBtn);
      actionsEl.appendChild(okBtn);
    } else {
      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "app-dialog-btn app-dialog-btn-primary";
      okBtn.textContent = options.okLabel || "확인";
      okBtn.onclick = () => closeAppDialog(true);
      actionsEl.appendChild(okBtn);
    }

    modal.style.display = "flex";
    _dialogKeyHandler = function (e) {
      if (e.key === "Escape") closeAppDialog(false);
    };
    document.addEventListener("keydown", _dialogKeyHandler);
  });
}

function appAlert(message, options) {
  const opts = typeof message === "string" ? { message, ...(options || {}) } : (message || {});
  return showAppDialog({ ...opts, confirm: false });
}

function appConfirm(message, options) {
  const opts = typeof message === "string" ? { message, ...(options || {}) } : (message || {});
  return showAppDialog({
    type: "warning",
    ...opts,
    confirm: true,
  });
}
