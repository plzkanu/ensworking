/** 전월 1일 00:00:00 (로컬 시간) */
export function getPreviousMonthFirstDay(reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth() - 1,
    1,
    0,
    0,
    0,
    0,
  );
}

export function formatDateYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseRetireDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 8) {
    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    if (
      year >= 1900 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0,
    0,
    0,
    0,
  );
}

/**
 * 전월 기준 사원명부 포함 여부
 * - retire_date 없음 → 포함
 * - retire_date >= 전월 1일 → 포함
 * - retire_date < 전월 1일 → 제외
 */
export function isEmployeeIncludedForPreviousMonth(
  retireDate: string | null | undefined,
  reference = new Date(),
): boolean {
  const trimmed = retireDate?.trim();
  if (!trimmed) {
    return true;
  }

  const parsed = parseRetireDate(trimmed);
  if (!parsed) {
    return true;
  }

  const cutoff = getPreviousMonthFirstDay(reference);
  return parsed >= cutoff;
}
