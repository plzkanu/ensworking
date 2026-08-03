export function formatOvertimeWindowRange(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt || !endsAt) {
    return "미설정";
  }
  const start = new Date(startsAt).toLocaleString("ko-KR");
  const end = new Date(endsAt).toLocaleString("ko-KR");
  return `${start} ~ ${end}`;
}

/** 홈 카드용: 날짜는 그대로, 시간은 '시'까지만 표시 */
export function formatOvertimeWindowRangeForDisplay(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt || !endsAt) {
    return "미설정";
  }
  return `${formatOvertimeDateHour(startsAt)} ~ ${formatOvertimeDateHour(endsAt)}`;
}

function formatOvertimeDateHour(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("ko-KR");
  const hourPart = date.toLocaleString("ko-KR", {
    hour: "numeric",
    hour12: true,
  });
  return `${datePart} ${hourPart}`;
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDatetimeLocalValue(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("일시 형식이 올바르지 않습니다.");
  }
  return parsed.toISOString();
}
