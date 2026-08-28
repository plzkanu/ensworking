/* ══════════════════════════════════════════════════════════════════
   시간외근무 입력 가능 기간: 시스템 날짜 기준 전월만
══════════════════════════════════════════════════════════════════ */
(function (global) {
  var MONTH_OFFSET = -1;
  var YEAR_MONTH_RE = /^\d{4}-\d{2}$/;
  var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatYearMonth(year, month) {
    return year + "-" + pad2(month);
  }

  function addCalendarMonths(year, month, delta) {
    var index = year * 12 + (month - 1) + delta;
    return {
      year: Math.floor(index / 12),
      month: (index % 12) + 1,
    };
  }

  function getKoreaCalendarDate(now) {
    var d = now || new Date();
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(d);
    var map = {};
    for (var i = 0; i < parts.length; i++) {
      map[parts[i].type] = parts[i].value;
    }
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
    };
  }

  function lastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function getOvertimeEntryWindowBounds(now) {
    var today = getKoreaCalendarDate(now);
    var target = addCalendarMonths(today.year, today.month, MONTH_OFFSET);
    var yearMonth = formatYearMonth(target.year, target.month);
    return {
      minYearMonth: yearMonth,
      maxYearMonth: yearMonth,
      minDate: yearMonth + "-01",
      maxDate: yearMonth + "-" + pad2(lastDayOfMonth(target.year, target.month)),
    };
  }

  function getOvertimeEntryWindowMessage(now) {
    var bounds = getOvertimeEntryWindowBounds(now);
    return (
      "근무일자는 시스템 날짜 기준 전월(" +
      bounds.maxYearMonth +
      ")만 입력할 수 있습니다."
    );
  }

  function isYearMonthWithinOvertimeEntryWindow(yearMonth, now) {
    if (!YEAR_MONTH_RE.test(yearMonth || "")) return false;
    var monthNum = Number(yearMonth.slice(5));
    if (monthNum < 1 || monthNum > 12) return false;
    var bounds = getOvertimeEntryWindowBounds(now);
    return yearMonth >= bounds.minYearMonth && yearMonth <= bounds.maxYearMonth;
  }

  function isDateInOvertimeEntryWindow(date, now) {
    if (!ISO_DATE_RE.test(date || "")) return false;
    var parsed = new Date(date + "T00:00:00+09:00");
    if (isNaN(parsed.getTime())) return false;
    var bits = date.split("-");
    var year = Number(bits[0]);
    var month = Number(bits[1]);
    var day = Number(bits[2]);
    if (day < 1 || day > lastDayOfMonth(year, month)) return false;
    return isYearMonthWithinOvertimeEntryWindow(bits[0] + "-" + bits[1], now);
  }

  function findRecordsOutsideOvertimeEntryWindow(records, now) {
    var list = records || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!isDateInOvertimeEntryWindow(list[i].date, now)) {
        out.push(list[i]);
      }
    }
    return out;
  }

  function applyOvertimeEntryDateLimits(el, now) {
    if (!el) return;
    var bounds = getOvertimeEntryWindowBounds(now);
    el.min = bounds.minDate;
    el.max = bounds.maxDate;
  }

  global.OVERTIME_ENTRY_MONTH_OFFSET = MONTH_OFFSET;
  global.getOvertimeEntryWindowBounds = getOvertimeEntryWindowBounds;
  global.getOvertimeEntryWindowMessage = getOvertimeEntryWindowMessage;
  global.isYearMonthWithinOvertimeEntryWindow = isYearMonthWithinOvertimeEntryWindow;
  global.isDateInOvertimeEntryWindow = isDateInOvertimeEntryWindow;
  global.findRecordsOutsideOvertimeEntryWindow = findRecordsOutsideOvertimeEntryWindow;
  global.applyOvertimeEntryDateLimits = applyOvertimeEntryDateLimits;
})(typeof window !== "undefined" ? window : this);
