/* ══════════════════════════════════════════════════════════════════
   ERP 미저장 목록 이탈 방지 (새로고침·링크 이동)
══════════════════════════════════════════════════════════════════ */
(function () {
  var bypassUnsaved = false;

  function hasUnsavedErpRecords() {
    return typeof RECORDS !== "undefined" && RECORDS.length > 0;
  }

  function unsavedCount() {
    return typeof RECORDS !== "undefined" ? RECORDS.length : 0;
  }

  function leaveMessage() {
    return (
      "목록에 ERP에 저장하지 않은 " +
      unsavedCount() +
      "건이 있습니다.\n" +
      "이 페이지를 벗어나면 입력 내용이 사라집니다.\n" +
      "계속 진행하시겠습니까?"
    );
  }

  function notifyParent() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: "overtime-unsaved", dirty: hasUnsavedErpRecords() },
        window.location.origin,
      );
    }
  }

  function syncUnsavedState() {
    notifyParent();
  }

  window.addEventListener("beforeunload", function (e) {
    if (bypassUnsaved || !hasUnsavedErpRecords()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  document.addEventListener(
    "click",
    function (e) {
      if (bypassUnsaved || !hasUnsavedErpRecords()) return;
      var a = e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) {
        return;
      }
      if (a.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      var navigate = function () {
        bypassUnsaved = true;
        window.location.href = a.href;
      };
      if (typeof appConfirm === "function") {
        void appConfirm({
          type: "warning",
          title: "ERP 미저장 데이터",
          message: leaveMessage(),
          confirmLabel: "계속",
          cancelLabel: "머무르기",
          danger: true,
        }).then(function (ok) {
          if (ok) navigate();
        });
      } else if (window.confirm(leaveMessage())) {
        navigate();
      }
    },
    true,
  );

  function wrapFn(name) {
    var fn = window[name];
    if (typeof fn !== "function") return;
    window[name] = function () {
      var result = fn.apply(this, arguments);
      syncUnsavedState();
      return result;
    };
  }

  wrapFn("render");
  wrapFn("resetAfterErpSubmit");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncUnsavedState);
  } else {
    syncUnsavedState();
  }
})();
