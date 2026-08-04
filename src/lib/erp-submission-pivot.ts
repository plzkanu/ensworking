import type {
  ErpSubmission,
  ErpSubmissionDayEntry,
  ErpSubmissionPersonBlock,
} from "./types";

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const FIXED_COLS = 4;
const COLS_PER_DAY = 5;
const SUB_HEADERS = [
  "시작시간",
  "종료시간",
  "시간수",
  "평일야간출근",
  "휴일조기출근",
] as const;

export interface ErpPivotContext {
  year: number;
  month: number;
  yearMonth: string;
  dates: string[];
}

export interface ErpPivotModel {
  context: ErpPivotContext;
  personBlocks: ErpSubmissionPersonBlock[];
  totalRows: number;
}

function buildMonthDates(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

export function resolvePivotContext(
  submissions: ErpSubmission[],
  filterYearMonth?: string,
): ErpPivotContext | null {
  const yearMonth =
    filterYearMonth?.trim() ||
    submissions[0]?.yearMonth ||
    submissions[0]?.payload.yearMonth;

  if (!yearMonth) {
    return null;
  }

  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) {
    return null;
  }

  const dates =
    submissions[0]?.payload.dates?.length &&
    submissions.every((item) => item.payload.yearMonth === yearMonth)
      ? submissions[0].payload.dates
      : buildMonthDates(year, month);

  return { year, month, yearMonth, dates };
}

export function mergePersonBlocks(
  submissions: ErpSubmission[],
): ErpSubmissionPersonBlock[] {
  const personMap = new Map<
    string,
    {
      name: string;
      empno: string;
      dept: string;
      workType: string;
      dateSlots: Record<string, ErpSubmissionDayEntry[]>;
    }
  >();

  for (const submission of submissions) {
    for (const block of submission.payload.personBlocks) {
      const key = `${block.empno}|${block.name}`;
      if (!personMap.has(key)) {
        personMap.set(key, {
          name: block.name,
          empno: block.empno,
          dept: block.dept,
          workType: block.workType || "직원(기본)",
          dateSlots: {},
        });
      }

      const person = personMap.get(key)!;
      if (block.dept) {
        person.dept = block.dept;
      }
      if (block.workType) {
        person.workType = block.workType;
      }

      for (const slot of block.slots) {
        for (const [date, entry] of Object.entries(slot)) {
          if (!person.dateSlots[date]) {
            person.dateSlots[date] = [];
          }
          person.dateSlots[date].push(entry);
        }
      }
    }
  }

  const blocks: ErpSubmissionPersonBlock[] = [];
  for (const person of personMap.values()) {
    const maxSlots = Math.max(
      1,
      ...Object.values(person.dateSlots).map((entries) => entries.length),
    );
    const slots = Array.from({ length: maxSlots }, (_, slotIndex) => {
      const entries: Record<string, ErpSubmissionDayEntry> = {};
      for (const [date, dayEntries] of Object.entries(person.dateSlots)) {
        if (dayEntries[slotIndex]) {
          entries[date] = dayEntries[slotIndex];
        }
      }
      return entries;
    });

    blocks.push({
      name: person.name,
      empno: person.empno,
      dept: person.dept,
      workType: person.workType,
      slots,
    });
  }

  return blocks.sort((a, b) => a.dept.localeCompare(b.dept, "ko"));
}

export function buildErpPivotModel(
  submissions: ErpSubmission[],
  filterYearMonth?: string,
): ErpPivotModel | null {
  const context = resolvePivotContext(submissions, filterYearMonth);
  if (!context) {
    return null;
  }

  const personBlocks = mergePersonBlocks(submissions);
  const totalRows = personBlocks.reduce(
    (count, block) => count + Math.max(1, block.slots.length),
    0,
  );

  return { context, personBlocks, totalRows };
}

export function pivotColIndex(dayIndex: number, subIndex: number): number {
  return FIXED_COLS + dayIndex * COLS_PER_DAY + subIndex;
}

export function formatPivotDateLabel(
  date: string,
  month: number,
  holidayName?: string,
): string {
  const dt = new Date(`${date}T00:00:00`);
  const day = dt.getDate();
  const dayKr = DAY_KR[dt.getDay()] ?? "";
  return `${month}/${day} (${dayKr})${holidayName ? `\n${holidayName}` : ""}`;
}

export function getPivotFixedHeaders(): string[] {
  return ["성명", "사번", "소속부서", "근무유형"];
}

export function getPivotSubHeaders(): readonly string[] {
  return SUB_HEADERS;
}

export function getPivotBlockRowCount(block: ErpSubmissionPersonBlock): number {
  return Math.max(1, block.slots.length);
}

export async function downloadErpPivotExcel(
  model: ErpPivotModel,
  filename?: string,
): Promise<void> {
  const XLSX = await import("xlsx-js-style");
  const { context, personBlocks } = model;
  const { dates, month } = context;
  const totalCols = FIXED_COLS + dates.length * COLS_PER_DAY;
  const colIdx = (dayIndex: number, subIndex: number) =>
    FIXED_COLS + dayIndex * COLS_PER_DAY + subIndex;

  const borderGray = {
    top: { style: "thin", color: { rgb: "AAAAAA" } },
    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
    left: { style: "thin", color: { rgb: "AAAAAA" } },
    right: { style: "thin", color: { rgb: "AAAAAA" } },
  };
  const sTitle = {
    font: { name: "맑은 고딕", sz: 20, bold: true, color: { rgb: "000000" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  const sHdrGreen = {
    font: { name: "맑은 고딕", sz: 10, bold: true, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "DAEEF3" }, patternType: "solid" },
    border: borderGray,
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };
  const sData = {
    font: { name: "맑은 고딕", sz: 10 },
    border: borderGray,
    alignment: { vertical: "center" },
  };
  const sHours = {
    font: { name: "맑은 고딕", sz: 10 },
    numFmt: "#,##0.0",
    border: borderGray,
    alignment: { horizontal: "right", vertical: "center" },
  };
  const sCheck = {
    font: { name: "맑은 고딕", sz: 10 },
    border: borderGray,
    alignment: { horizontal: "center", vertical: "center" },
  };

  const ws: Record<string, unknown> = {};
  const encCell = (row: number, col: number) => XLSX.utils.encode_cell({ r: row, c: col });
  const setCell = (
    row: number,
    col: number,
    value: string | number,
    style: Record<string, unknown>,
    type?: "s" | "n",
  ) => {
    const cell: Record<string, unknown> = { v: value, s: style };
    if (type) {
      cell.t = type;
    } else if (typeof value === "number") {
      cell.t = "n";
    } else {
      cell.t = "s";
    }
    ws[encCell(row, col)] = cell;
  };

  const R_TITLE = 0;
  const R_DATE = 1;
  const R_HDR = 2;
  const R_DATA = 3;

  setCell(R_TITLE, 0, "시간외근무신청(ERP)", sTitle);
  for (let col = 1; col < totalCols; col++) {
    setCell(R_TITLE, col, "", sTitle);
  }

  setCell(R_DATE, 0, "기본정보", sHdrGreen);
  for (let col = 1; col < FIXED_COLS; col++) {
    setCell(R_DATE, col, "", sHdrGreen);
  }
  dates.forEach((date, dayIndex) => {
    setCell(
      R_DATE,
      colIdx(dayIndex, 0),
      formatPivotDateLabel(date, month),
      sHdrGreen,
    );
    for (let sub = 1; sub < COLS_PER_DAY; sub++) {
      setCell(R_DATE, colIdx(dayIndex, sub), "", sHdrGreen);
    }
  });

  getPivotFixedHeaders().forEach((header, col) => {
    setCell(R_HDR, col, header, sHdrGreen);
  });
  dates.forEach((_, dayIndex) => {
    SUB_HEADERS.forEach((header, subIndex) => {
      setCell(R_HDR, colIdx(dayIndex, subIndex), header, sHdrGreen);
    });
  });

  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [
    { s: { r: R_TITLE, c: 0 }, e: { r: R_TITLE, c: totalCols - 1 } },
    { s: { r: R_DATE, c: 0 }, e: { r: R_DATE, c: FIXED_COLS - 1 } },
  ];
  dates.forEach((_, dayIndex) => {
    merges.push({
      s: { r: R_DATE, c: colIdx(dayIndex, 0) },
      e: { r: R_DATE, c: colIdx(dayIndex, COLS_PER_DAY - 1) },
    });
  });

  let currentRow = R_DATA;
  for (const block of personBlocks) {
    const rowStart = currentRow;
    const rowEnd = currentRow + getPivotBlockRowCount(block) - 1;

    for (let row = rowStart; row <= rowEnd; row++) {
      setCell(row, 0, block.name, sData);
      setCell(row, 1, block.empno, sData);
      setCell(row, 2, block.dept, sData);
      setCell(row, 3, block.workType || "직원(기본)", sData);
    }

    block.slots.forEach((entries, slotIndex) => {
      const row = rowStart + slotIndex;
      dates.forEach((date, dayIndex) => {
        const entry = entries[date];
        if (entry) {
          setCell(row, colIdx(dayIndex, 0), entry.start || "", sData);
          setCell(row, colIdx(dayIndex, 1), entry.end || "", sData);
          setCell(row, colIdx(dayIndex, 2), entry.hours || 0, sHours);
          setCell(row, colIdx(dayIndex, 3), entry.night_work ? 1 : 0, sCheck);
          setCell(row, colIdx(dayIndex, 4), entry.holiday_early ? 1 : 0, sCheck);
        } else {
          for (let sub = 0; sub < COLS_PER_DAY; sub++) {
            setCell(row, colIdx(dayIndex, sub), "", sData);
          }
        }
      });
    });

    currentRow = rowEnd + 1;
  }

  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 10 },
    { wch: 9 },
    { wch: 22 },
    { wch: 10 },
    ...Array.from({ length: dates.length * COLS_PER_DAY }, (_, index) => {
      const sub = index % COLS_PER_DAY;
      if (sub === 2) {
        return { wch: 7 };
      }
      if (sub >= 3) {
        return { wch: 9 };
      }
      return { wch: 8 };
    }),
  ];
  ws["!rows"] = [
    { hpt: 38 },
    { hpt: 30 },
    { hpt: 30 },
    ...Array.from({ length: currentRow - R_DATA }, () => ({ hpt: 20 })),
  ];
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow - 1, c: totalCols - 1 },
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as never, "시간외근무신청");

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, filename ?? `시간외근무신청(ERP)_${stamp}.xlsx`, {
    bookType: "xlsx",
    type: "binary",
    cellStyles: true,
  });
}
