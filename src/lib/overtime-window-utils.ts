const KST = "Asia/Seoul";

function formatOvertimeDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatOvertimeWindowRange(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt || !endsAt) {
    return "미설정";
  }
  return `${formatOvertimeDateTime(startsAt)} ~ ${formatOvertimeDateTime(endsAt)}`;
}

/** 홈 카드용: 등록기간 설정과 동일한 한국시간(시·분) 표시 */
export function formatOvertimeWindowRangeForDisplay(
  startsAt: string | null,
  endsAt: string | null,
): string {
  return formatOvertimeWindowRange(startsAt, endsAt);
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromDatetimeLocalValue(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("일시 형식이 올바르지 않습니다.");
  }
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00+09:00`,
  );
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("일시 형식이 올바르지 않습니다.");
  }
  return parsed.toISOString();
}
