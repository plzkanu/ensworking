import type {
  ErpSubmission,
  ErpSubmissionDayEntry,
  ErpSubmissionPersonBlock,
} from "./types";

export const ERP_EXCEL_HEADERS = [
  "순번",
  "이름",
  "부서",
  "사번",
  "근무일자",
  "요일",
  "시작",
  "종료",
  "시간수",
  "근무유형",
  "평일야간출근",
  "휴일조기출근",
  "비고",
  "파일",
] as const;

export interface ErpSubmissionExcelRow {
  seq: number;
  name: string;
  dept: string;
  empno: string;
  date: string;
  dayKr: string;
  start: string;
  end: string;
  hours: number | string;
  workType: string;
  nightLabel: string;
  holLabel: string;
  notes: string;
  file: string;
}

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function isWeekend(date: string): boolean {
  const dt = new Date(`${date}T00:00:00`);
  const dow = dt.getDay();
  return dow === 0 || dow === 6;
}

function dayOfWeekKr(date: string): string {
  const dt = new Date(`${date}T00:00:00`);
  return DAY_KR[dt.getDay()] ?? "";
}

function buildFileLabel(
  yearMonth: string,
  block: ErpSubmissionPersonBlock,
): string {
  const [yr, mo] = yearMonth.split("-");
  const monthNum = Number(mo);
  const dept = block.dept?.trim() ?? "";
  const name = block.name?.trim() ?? "";
  return `${yr}년 ${monthNum}월 ${dept} ${name} 근무일지`.replace(/\s+/g, " ").trim();
}

function buildRowLabels(
  date: string,
  entry: ErpSubmissionDayEntry,
): Pick<
  ErpSubmissionExcelRow,
  "workType" | "nightLabel" | "holLabel" | "notes"
> {
  const isHoliday = isWeekend(date);
  const isBefore9 = entry.start && entry.start < "09:00";
  const hol = entry.holiday_early;
  const night = entry.night_work;

  const holMissing = isHoliday && isBefore9 && !hol;
  const holWrong = hol && (!isHoliday || !isBefore9);

  const noteParts = [
    holMissing ? "휴일조기출근누락가능" : "",
    holWrong ? "휴일조기출근오체크가능" : "",
    night ? "평일야간출근확인" : "",
  ].filter(Boolean);

  const holLabel = hol
    ? holWrong
      ? "체크(확인필요)"
      : "체크"
    : holMissing
      ? "미체크(누락가능)"
      : "";
  const nightLabel = night ? "체크(확인필요)" : "";

  return {
    workType: isHoliday ? "휴일시간외" : "평일시간외",
    nightLabel,
    holLabel,
    notes: noteParts.join(" / "),
  };
}

function flattenSubmission(submission: ErpSubmission): ErpSubmissionExcelRow[] {
  const rows: ErpSubmissionExcelRow[] = [];

  for (const block of submission.payload.personBlocks) {
    for (const slot of block.slots) {
      for (const [date, entry] of Object.entries(slot)) {
        const labels = buildRowLabels(date, entry);
        rows.push({
          seq: 0,
          name: block.name || "",
          dept: block.dept || "",
          empno: block.empno || "",
          date,
          dayKr: dayOfWeekKr(date),
          start: entry.start || "",
          end: entry.end || "",
          hours: entry.hours ?? "",
          file: buildFileLabel(submission.yearMonth, block),
          ...labels,
        });
      }
    }
  }

  return rows;
}

export function flattenSubmissionsToRows(
  submissions: ErpSubmission[],
): ErpSubmissionExcelRow[] {
  const rows = submissions.flatMap(flattenSubmission);

  rows.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.dept.localeCompare(b.dept, "ko") ||
      a.name.localeCompare(b.name, "ko") ||
      a.start.localeCompare(b.start),
  );

  return rows.map((row, index) => ({ ...row, seq: index + 1 }));
}

export function erpRowToArray(row: ErpSubmissionExcelRow): (string | number)[] {
  return [
    row.seq,
    row.name,
    row.dept,
    row.empno,
    row.date,
    row.dayKr,
    row.start,
    row.end,
    row.hours,
    row.workType,
    row.nightLabel,
    row.holLabel,
    row.notes,
    row.file,
  ];
}

export function getErpRowStyleFlags(row: ErpSubmissionExcelRow) {
  const isHolidayRow = row.workType === "휴일시간외";
  const isNight = !!row.nightLabel;
  const isHolWarn = row.holLabel.includes("확인필요");
  const isHolMiss = row.holLabel.includes("누락가능");

  return { isHolidayRow, isNight, isHolWarn, isHolMiss };
}

export async function downloadErpSubmissionExcel(
  rows: ErpSubmissionExcelRow[],
  filename?: string,
): Promise<void> {
  const XLSX = await import("xlsx-js-style");
  const dataRows = rows.map(erpRowToArray);
  const wsData = [ERP_EXCEL_HEADERS.slice(), ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 5 },
    { wch: 9 },
    { wch: 18 },
    { wch: 8 },
    { wch: 12 },
    { wch: 5 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 11 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
  ];

  ws["!rows"] = [{ hpt: 20 }];
  for (let i = 0; i < dataRows.length; i++) {
    ws["!rows"].push({ hpt: 18 });
  }

  const fontBase = { name: "맑은 고딕", sz: 10 };
  const fontHdr = {
    name: "맑은 고딕",
    sz: 10,
    bold: true,
    color: { rgb: "FFFFFF" },
  };
  const fontWarn = { name: "맑은 고딕", sz: 10, color: { rgb: "D97706" } };
  const fontHol = { name: "맑은 고딕", sz: 10, color: { rgb: "F04452" }, bold: true };
  const fontNight = { name: "맑은 고딕", sz: 10, color: { rgb: "7C3AED" }, bold: true };

  const border = {
    top: { style: "thin", color: { rgb: "E2E5EA" } },
    bottom: { style: "thin", color: { rgb: "E2E5EA" } },
    left: { style: "thin", color: { rgb: "E2E5EA" } },
    right: { style: "thin", color: { rgb: "E2E5EA" } },
  };
  const borderHdr = {
    top: { style: "thin", color: { rgb: "2170D8" } },
    bottom: { style: "thin", color: { rgb: "2170D8" } },
    left: { style: "thin", color: { rgb: "2170D8" } },
    right: { style: "thin", color: { rgb: "2170D8" } },
  };

  const fillHdr = { fgColor: { rgb: "3182F6" }, patternType: "solid" };
  const fillEven = { fgColor: { rgb: "EBF3FE" }, patternType: "solid" };
  const fillWarn = { fgColor: { rgb: "FFF8E6" }, patternType: "solid" };
  const fillNight = { fgColor: { rgb: "F3E8FF" }, patternType: "solid" };

  const alignC = { horizontal: "center", vertical: "center" };
  const alignL = { horizontal: "left", vertical: "center" };
  const centerCols = new Set([0, 5, 6, 7, 8, 10, 11]);

  for (let ri = 0; ri < wsData.length; ri++) {
    const isHdr = ri === 0;
    const row = isHdr ? null : rows[ri - 1];
    const flags = row ? getErpRowStyleFlags(row) : null;

    for (let ci = 0; ci < ERP_EXCEL_HEADERS.length; ci++) {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (!ws[addr]) {
        ws[addr] = { v: "", t: "s" };
      }

      let fill;
      if (isHdr) {
        fill = fillHdr;
      } else if (flags?.isNight) {
        fill = fillNight;
      } else if (flags?.isHolWarn || flags?.isHolMiss) {
        fill = fillWarn;
      } else if (ri % 2 === 0) {
        fill = fillEven;
      }

      let font: Record<string, unknown> = fontBase;
      if (isHdr) {
        font = fontHdr;
      } else if (ci === 10 && flags?.isNight) {
        font = fontNight;
      } else if (ci === 11 && flags?.isHolWarn) {
        font = fontWarn;
      } else if (ci === 11 && flags?.isHolMiss) {
        font = { ...fontWarn, color: { rgb: "F04452" } };
      } else if (ci === 9 && flags?.isHolidayRow) {
        font = fontHol;
      } else if (ci === 5) {
        const dayV = String(wsData[ri][ci]);
        if (dayV === "토") {
          font = { ...fontBase, color: { rgb: "3182F6" }, bold: true };
        } else if (dayV === "일") {
          font = { ...fontBase, color: { rgb: "F04452" }, bold: true };
        }
      }

      ws[addr].s = {
        font,
        fill,
        border: isHdr ? borderHdr : border,
        alignment: centerCols.has(ci) ? alignC : alignL,
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "시간외근무_입력목록");

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, filename ?? `시간외근무_${stamp}.xlsx`, {
    bookType: "xlsx",
    type: "binary",
    cellStyles: true,
  });
}
