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

export function collectRecordFingerprints(
  payload: ErpSubmissionPayload,
): ErpRecordFingerprint[] {
  const records: ErpRecordFingerprint[] = [];

  for (const block of payload.personBlocks) {
    for (const slot of block.slots) {
      for (const [date, entry] of Object.entries(slot)) {
        if (!entry) {
          continue;
        }
        records.push({
          empno: block.empno.trim(),
          name: block.name.trim(),
          date: date.trim(),
          start: (entry.start || "").trim(),
          end: (entry.end || "").trim(),
          hours: normalizeHours(entry.hours),
          night_work: !!entry.night_work,
          holiday_early: !!entry.holiday_early,
        });
      }
    }
  }

  return records;
}

export function fingerprintKey(record: ErpRecordFingerprint): string {
  return [
    record.empno,
    record.name,
    record.date,
    record.start,
    record.end,
    String(record.hours),
    record.night_work ? "1" : "0",
    record.holiday_early ? "1" : "0",
  ].join("|");
}

export function findDuplicateRecords(
  incoming: ErpRecordFingerprint[],
  existingPayloads: ErpSubmissionPayload[],
): ErpRecordFingerprint[] {
  const existingKeys = new Set<string>();

  for (const payload of existingPayloads) {
    for (const record of collectRecordFingerprints(payload)) {
      existingKeys.add(fingerprintKey(record));
    }
  }

  const seen = new Set<string>();
  const duplicates: ErpRecordFingerprint[] = [];

  for (const record of incoming) {
    const key = fingerprintKey(record);
    if (!existingKeys.has(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    duplicates.push(record);
  }

  return duplicates;
}

export function formatDuplicateRecordsMessage(
  duplicates: ErpRecordFingerprint[],
): string {
  const preview = duplicates
    .slice(0, 5)
    .map((record) => `${record.name} · ${record.date} · ${record.start}~${record.end}`)
    .join("\n");
  const extra =
    duplicates.length > 5 ? `\n… 외 ${duplicates.length - 5}건` : "";

  return (
    `이미 제출된 근무 데이터와 ${duplicates.length}건이 중복됩니다.\n` +
    `동일한 자료는 다시 저장할 수 없습니다.\n\n` +
    `${preview}${extra}\n\n` +
    `ERP 제출 내역에서 기존 데이터를 확인하거나, 필요 시 삭제한 후 다시 시도해 주세요.`
  );
}
