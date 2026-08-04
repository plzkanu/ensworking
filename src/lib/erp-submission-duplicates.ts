import type { ErpSubmissionPayload } from "./types";

export interface ErpRecordFingerprint {
  empno: string;
  name: string;
  date: string;
  start: string;
  end: string;
  hours: number;
  night_work: boolean;
  holiday_early: boolean;
}

function normalizeHours(hours: number | string | undefined): number {
  const value = typeof hours === "number" ? hours : Number(hours);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 10) / 10;
}

export function normalizeEmpno(empno: string): string {
  const digits = empno.trim().replace(/\D/g, "");
  if (!digits) {
    return empno.trim();
  }
  const stripped = digits.replace(/^0+/, "") || "0";
  return stripped.padStart(6, "0");
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, "");
}

export function coerceSubmissionPayload(
  raw: unknown,
): ErpSubmissionPayload | null {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const payload = value as ErpSubmissionPayload;
  if (!Array.isArray(payload.personBlocks)) {
    return null;
  }
  return payload;
}

export function collectRecordFingerprints(
  payloadInput: ErpSubmissionPayload | unknown,
): ErpRecordFingerprint[] {
  const payload = coerceSubmissionPayload(payloadInput);
  if (!payload) {
    return [];
  }

  const records: ErpRecordFingerprint[] = [];

  for (const block of payload.personBlocks) {
    if (!block || !Array.isArray(block.slots)) {
      continue;
    }
    for (const slot of block.slots) {
      if (!slot || typeof slot !== "object") {
        continue;
      }
      for (const [date, entry] of Object.entries(slot)) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        records.push({
          empno: normalizeEmpno(block.empno || ""),
          name: normalizeName(block.name || ""),
          date: date.trim(),
          start: normalizeTime(String(entry.start || "")),
          end: normalizeTime(String(entry.end || "")),
          hours: normalizeHours(entry.hours),
          night_work: !!entry.night_work,
          holiday_early: !!entry.holiday_early,
        });
      }
    }
  }

  return records;
}

function employeeDayKey(record: ErpRecordFingerprint): string {
  return [record.empno, record.name, record.date].join("|");
}

function toMinutes(hhmm: string): number | null {
  const trimmed = hhmm.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function normalizeTime(hhmm: string): string {
  const minutes = toMinutes(hhmm);
  if (minutes === null) {
    return hhmm.trim();
  }
  if (minutes === 1440) {
    return "24:00";
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** 근무일지와 동일: 자정 넘김은 end에 +1440분 적용 후 겹침 판정 */
export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const aS = toMinutes(normalizeTime(startA));
  const aE = toMinutes(normalizeTime(endA));
  const bS = toMinutes(normalizeTime(startB));
  const bE = toMinutes(normalizeTime(endB));

  if (aS === null || aE === null || bS === null || bE === null) {
    return (
      normalizeTime(startA) === normalizeTime(startB) &&
      normalizeTime(endA) === normalizeTime(endB)
    );
  }

  let aEnd = aE;
  let bEnd = bE;
  if (aEnd <= aS) {
    aEnd += 1440;
  }
  if (bEnd <= bS) {
    bEnd += 1440;
  }

  return aS < bEnd && bS < aEnd;
}

export function recordsConflict(
  left: ErpRecordFingerprint,
  right: ErpRecordFingerprint,
): boolean {
  if (employeeDayKey(left) !== employeeDayKey(right)) {
    return false;
  }

  return timeRangesOverlap(left.start, left.end, right.start, right.end);
}

export function findDuplicateRecords(
  incoming: ErpRecordFingerprint[],
  existingPayloads: Array<ErpSubmissionPayload | unknown>,
): ErpRecordFingerprint[] {
  const existingRecords = existingPayloads.flatMap((payload) =>
    collectRecordFingerprints(payload),
  );

  const duplicates: ErpRecordFingerprint[] = [];
  const seen = new Set<string>();

  for (const record of incoming) {
    const hasConflict = existingRecords.some((existing) =>
      recordsConflict(record, existing),
    );
    if (!hasConflict) {
      continue;
    }

    const reportKey = `${employeeDayKey(record)}|${record.start}|${record.end}`;
    if (seen.has(reportKey)) {
      continue;
    }
    seen.add(reportKey);
    duplicates.push(record);
  }

  return duplicates;
}

export function formatDuplicateRecordsMessage(
  duplicates: ErpRecordFingerprint[],
): string {
  const preview = duplicates
    .slice(0, 5)
    .map(
      (record) =>
        `${record.name}(${record.empno}) · ${record.date} · ${record.start}~${record.end}`,
    )
    .join("\n");
  const extra =
    duplicates.length > 5 ? `\n… 외 ${duplicates.length - 5}건` : "";

  return (
    `이미 제출된 근무 데이터와 ${duplicates.length}건이 중복됩니다.\n` +
    `같은 사번·이름·근무일에 동일하거나 겹치는 근무 시간은 다시 저장할 수 없습니다.\n` +
    `(평일야간출근·휴일조기출근 체크 여부와 관계없이 적용됩니다.)\n\n` +
    `${preview}${extra}\n\n` +
    `ERP 제출 내역에서 기존 데이터를 확인하거나, 필요 시 삭제한 후 다시 시도해 주세요.`
  );
}
