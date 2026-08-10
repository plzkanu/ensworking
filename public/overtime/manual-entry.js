/* ══════════════════════════════════════════════════════════════════
   수동 입력 (1건씩)
   - MANUAL_ENTRY_SKIP_FRIDAY_0918: 유연근무는 금요일 09-18 검사 제외
══════════════════════════════════════════════════════════════════ */
let manualEndEdited = false;
let manualTimeSelectsReady = false;

const manualSelectStyle =
  "width:100%;margin-top:4px;padding:8px 10px;font-size:13px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--t1)";

function manualTimeLabel(mins) {
  if (mins === 1440) return "24:00";
  const m = ((mins % 1440) + 1440) % 1440;
  return (
    String(Math.floor(m / 60)).padStart(2, "0") +
    ":" +
    String(m % 60).padStart(2, "0")
  );
}

function initManualTimeSelects() {
  if (manualTimeSelectsReady) return;
  const startEl = document.getElementById("manualStart");
  const endEl = document.getElementById("manualEnd");
  if (!startEl || !endEl || startEl.tagName !== "SELECT") return;

  const startOpts = ['<option value="">선택</option>'];
  for (let m = 0; m < 1440; m += 30) {
    const v = manualTimeLabel(m);
    startOpts.push(`<option value="${v}">${v}</option>`);
  }
  startEl.innerHTML = startOpts.join("");
  startEl.style.cssText = manualSelectStyle;

  const endOpts = ['<option value="">선택</option>'];
  for (let m = 30; m < 1440; m += 30) {
    const v = manualTimeLabel(m);
    endOpts.push(`<option value="${v}">${v}</option>`);
  }
  endOpts.push('<option value="24:00">24:00</option>');
  endEl.innerHTML = endOpts.join("");
  endEl.style.cssText = manualSelectStyle;

  manualTimeSelectsReady = true;
}

function setManualEndSelectValue(endEl, hhmm) {
  if (!endEl || !hhmm) {
    endEl.value = "";
    return;
  }
  if (![...endEl.options].some(function (o) { return o.value === hhmm; })) {
    const opt = document.createElement("option");
    opt.value = hhmm;
    opt.textContent = hhmm;
    endEl.appendChild(opt);
  }
  endEl.value = hhmm;
}

function openManualEntryModal() {
  initManualTimeSelects();
  if (!masterLoaded) {
    void appAlert({
      type: "warning",
      title: "사원명부 필요",
      message: "사원명부를 먼저 불러온 뒤 수동 입력해 주세요.",
    });
    return;
  }
  resetManualEntryForm();
  document.getElementById("manualEntryModal").style.display = "flex";
}

function closeManualEntryModal() {
  document.getElementById("manualEntryModal").style.display = "none";
}

function resetManualEntryForm() {
  manualEndEdited = false;
  document.getElementById("manualName").value = "";
  document.getElementById("manualEmp").value = "";
  document.getElementById("manualEmp").dataset.picked = "";
  document.getElementById("manualDept").value = "";
  document.getElementById("manualDate").value = "";
  document.getElementById("manualStart").value = "";
  document.getElementById("manualEnd").value = "";
  document.getElementById("manualHours").value = "";
  document.getElementById("manualContent").value = "";
  document.getElementById("manualNight").checked = false;
  document.getElementById("manualHol").checked = false;
  const hint = document.getElementById("manualNameHint");
  if (hint) hint.innerHTML = "";
}

function onManualNameInput() {
  const nameEl = document.getElementById("manualName");
  const empEl = document.getElementById("manualEmp");
  const deptEl = document.getElementById("manualDept");
  const hint = document.getElementById("manualNameHint");
  const name = (nameEl.value || "").trim();
  if (!name) {
    empEl.value = "";
    empEl.dataset.picked = "";
    deptEl.value = "";
    if (hint) hint.innerHTML = "";
    return;
  }
  const matches = masterByName[name] || [];
  if (matches.length === 1) {
    empEl.value = matches[0].empno;
    empEl.dataset.picked = matches[0].empno;
    deptEl.value = matches[0].dept || "";
    if (hint) hint.innerHTML = "";
    return;
  }
  if (matches.length > 1) {
    empEl.value = "";
    empEl.dataset.picked = "";
    deptEl.value = "";
    if (hint) {
      hint.innerHTML = `<span style="color:var(--orange)">동명이인 ${matches.length}명 — 사번을 선택해 주세요.</span>`;
    }
    openDuplicateNamePicker(name, matches);
    return;
  }
  empEl.dataset.picked = "";
  deptEl.value = "";
  if (hint) {
    hint.innerHTML = `<span style="color:var(--t4)">명부에 '${escHtml(name)}' 없음 — 사번을 직접 입력하세요</span>`;
  }
}

function onManualEmpInput() {
  const box = document.getElementById("manualEntryFix");
  if (box) updateFixHint(box);
  const empEl = document.getElementById("manualEmp");
  const deptEl = document.getElementById("manualDept");
  const empno = (empEl.value || "").trim();
  const info = empno ? getInfo(empno) : null;
  deptEl.value = info ? info.dept || "" : "";
}

function openDuplicateNamePicker(name, matches) {
  document.getElementById("dupNameLabel").textContent = name;
  document.getElementById("dupNameList").innerHTML = matches
    .map(function (m) {
      return (
        `<button type="button" class="dup-pick-btn" onclick="selectDuplicateName('${escHtml(m.empno)}','${escHtml(m.dept || "")}')">` +
        `<span style="font-weight:700;color:var(--blue)">${escHtml(m.empno)}</span>` +
        `<span style="color:var(--t3);margin-left:8px">${escHtml(m.dept || "부서 미지정")}</span>` +
        `</button>`
      );
    })
    .join("");
  document.getElementById("dupNameModal").style.display = "flex";
}

function closeDuplicateNameModal() {
  document.getElementById("dupNameModal").style.display = "none";
}

function selectDuplicateName(empno, dept) {
  const empEl = document.getElementById("manualEmp");
  empEl.value = empno;
  empEl.dataset.picked = empno;
  document.getElementById("manualDept").value = dept || "";
  closeDuplicateNameModal();
  const hint = document.getElementById("manualNameHint");
  if (hint) hint.innerHTML = `<span style="color:var(--green)">사번 ${escHtml(empno)} 선택됨</span>`;
  const box = document.getElementById("manualEntryFix");
  if (box) updateFixHint(box);
}

function calcManualEndFromHours() {
  if (manualEndEdited) return;
  const startEl = document.getElementById("manualStart");
  const hoursEl = document.getElementById("manualHours");
  const endEl = document.getElementById("manualEnd");
  const start = (startEl.value || "").trim();
  const hours = parseFloat(hoursEl.value);
  if (!start || !/^\d{2}:\d{2}$/.test(start) || !Number.isFinite(hours) || hours <= 0) {
    endEl.value = "";
    return;
  }
  const snappedStart = snapStart(start);
  startEl.value = snappedStart;
  const endMin = toMin(snappedStart) + Math.round(hours * 60);
  setManualEndSelectValue(endEl, snapEnd(minToHM(endMin)));
}

function onManualStartOrHoursChange() {
  manualEndEdited = false;
  calcManualEndFromHours();
}

function onManualEndChange() {
  manualEndEdited = true;
  const endEl = document.getElementById("manualEnd");
  const end = (endEl.value || "").trim();
  if (/^\d{2}:\d{2}$/.test(end)) {
    setManualEndSelectValue(endEl, snapEnd(end));
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initManualTimeSelects);
  } else {
    initManualTimeSelects();
  }
}

function isManual0918Blocked(date, start, end) {
  if (!date || !start || !end) return false;
  const dt = new Date(date + "T00:00:00");
  const dow = dt.getDay();
  const ch = getCustomHolidays();
  const isHoliday = dow === 0 || dow === 6 || !!HOLIDAYS[date] || !!ch[date];
  if (isHoliday) return false;
  if (window.MANUAL_ENTRY_SKIP_FRIDAY_0918 && dow === 5) return false;
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 1440;
  const hidS = Math.max(s, 9 * 60);
  const hidE = Math.min(e, 18 * 60);
  return hidE - hidS > 0;
}

function submitManualEntry() {
  const name = (document.getElementById("manualName").value || "").trim();
  const empno = (document.getElementById("manualEmp").value || "").trim();
  const date = (document.getElementById("manualDate").value || "").trim();
  const startRaw = (document.getElementById("manualStart").value || "").trim();
  const endRaw = (document.getElementById("manualEnd").value || "").trim();
  const hoursRaw = (document.getElementById("manualHours").value || "").trim();
  const content = (document.getElementById("manualContent").value || "").trim();
  const nightWork = document.getElementById("manualNight").checked;
  const holidayEarly = document.getElementById("manualHol").checked;

  if (!name || !empno || !date || !startRaw || !endRaw || !hoursRaw) {
    void appAlert({
      type: "warning",
      title: "입력 확인",
      message: "이름, 사번, 근무일자, 시작, 종료, 시간수를 모두 입력해 주세요.",
    });
    return;
  }

  if (!/^\d{6}$/.test(empno)) {
    void appAlert({
      type: "warning",
      title: "사번 확인",
      message: "사번은 6자리 숫자로 입력해 주세요.",
    });
    return;
  }

  const matches = masterByName[name] || [];
  if (matches.length > 1) {
    const picked = document.getElementById("manualEmp").dataset.picked || "";
    if (!picked || !matches.some(function (m) { return m.empno === empno; })) {
      void appAlert({
        type: "warning",
        title: "동명이인 선택",
        message: "동명이인입니다. 사번을 선택해 주세요.",
      });
      openDuplicateNamePicker(name, matches);
      return;
    }
  }

  if (!/^\d{2}:\d{2}$/.test(startRaw) || !/^\d{2}:\d{2}$/.test(endRaw)) {
    void appAlert({
      type: "warning",
      title: "시간 형식",
      message: "시작·종료 시각은 HH:MM 형식으로 입력해 주세요.",
    });
    return;
  }

  const hours = round05(parseFloat(hoursRaw));
  if (!Number.isFinite(hours) || hours <= 0) {
    void appAlert({
      type: "warning",
      title: "시간수 확인",
      message: "시간수는 0보다 큰 값으로 입력해 주세요.",
    });
    return;
  }

  const start = snapStart(startRaw);
  const end = snapEnd(endRaw);
  const _timeSnapped = start !== startRaw || end !== endRaw;

  if (isManual0918Blocked(date, start, end)) {
    void appAlert({
      type: "warning",
      title: "근무시간 확인",
      message:
        "평일 09:00~18:00 정상근무 시간대와 겹칩니다.\n근무일자 또는 시간을 확인해 주세요.",
    });
    return;
  }

  const rec = {
    seq: 0,
    name: name,
    empno: empno,
    date: date,
    start: start,
    end: end,
    hours: hours,
    _timeSnapped: _timeSnapped,
    holiday_early: holidayEarly,
    night_work: nightWork,
    _origHol: holidayEarly,
    _origNight: nightWork,
    content: content,
    file: "(수동입력)",
    _pageNo: 0,
    _rowNo: 0,
  };

  const split = splitAllRecords([rec]);
  RECORDS.push.apply(RECORDS, split);
  updateBadge();
  render();
  closeManualEntryModal();
  void appAlert({
    type: "success",
    title: "추가 완료",
    message: `${name} ${date} ${start}~${end} (${hours}시간) 항목이 추가되었습니다.`,
  });
}
