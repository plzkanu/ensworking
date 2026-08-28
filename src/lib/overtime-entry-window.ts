import type { ErpSubmissionPayload } from "./types";

/** 시스템 날짜(한국시간) 기준, 이 개월 수만큼 이전 연월만 입력 허용 */
export const OVERTIME_ENTRY_MONTH_OFFSET = -1;

const KST = "Asia/Seoul";
const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface OvertimeEntryWindowBounds {
  minYearMonth: string;
  maxYearMonth: string;
  minDate: string;
  maxDate: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

export function addCalendarMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

export function getKoreaCalendarDate(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getOvertimeEntryWindowBounds(
  now: Date = new Date(),
): OvertimeEntryWindowBounds {
  const { year, month } = getKoreaCalendarDate(now);
  const target = addCalendarMonths(year, month, OVERTIME_ENTRY_MONTH_OFFSET);
  const yearMonth = formatYearMonth(target.year, target.month);
  return {
    minYearMonth: yearMonth,
    maxYearMonth: yearMonth,
    minDate: `${yearMonth}-01`,
    maxDate: `${yearMonth}-${pad2(lastDayOfMonth(target.year, target.month))}`,
  };
}

export function getOvertimeEntryWindowMessage(now: Date = new Date()): string {
  const bounds = getOvertimeEntryWindowBounds(now);
  return `근무일자는 시스템 날짜 기준 전월(${bounds.maxYearMonth})만 입력할 수 있습니다.`;
}

export function isYearMonthWithinOvertimeEntryWindow(
  yearMonth: string,
  now: Date = new Date(),
): boolean {
  if (!YEAR_MONTH_RE.test(yearMonth)) {
    return false;
  }
  const monthNum = Number(yearMonth.slice(5));
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  const bounds = getOvertimeEntryWindowBounds(now);
  return yearMonth >= bounds.minYearMonth && yearMonth <= bounds.maxYearMonth;
}

export function isDateWithinOvertimeEntryWindow(
  date: string,
  now: Date = new Date(),
): boolean {
  if (!ISO_DATE_RE.test(date)) {
    return false;
  }
  const parsed = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  const [yearText, monthText, dayText] = date.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (day < 1 || day > lastDayOfMonth(year, month)) {
    return false;
  }
  return isYearMonthWithinOvertimeEntryWindow(`${yearText}-${monthText}`, now);
}

function collectPayloadWorkDates(payload: ErpSubmissionPayload): string[] {
  const dates = new Set<string>();
  for (const block of payload.personBlocks) {
    if (!block || !Array.isArray(block.slots)) {
      continue;
    }
    for (const slot of block.slots) {
      if (!slot || typeof slot !== "object") {
        continue;
      }
      for (const date of Object.keys(slot)) {
        dates.add(date);
      }
    }
  }
  return [...dates];
}

export function assertOvertimeEntryPeriod(
  payload: ErpSubmissionPayload,
  now: Date = new Date(),
): void {
  const message = getOvertimeEntryWindowMessage(now);
  if (!isYearMonthWithinOvertimeEntryWindow(payload.yearMonth, now)) {
    throw new Error(message);
  }

  const workDates = collectPayloadWorkDates(payload);
  const outside = workDates.filter(
    (date) => !isDateWithinOvertimeEntryWindow(date, now),
  );
  if (outside.length > 0) {
    const sample = [...new Set(outside)].sort().slice(0, 5).join(", ");
    throw new Error(`${message}\n허용 기간을 벗어난 근무일자: ${sample}`);
  }
}
