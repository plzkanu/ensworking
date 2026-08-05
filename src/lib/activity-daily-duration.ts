import type { ActivityLogEntry } from "@/lib/types";

export interface DailyAccessDuration {
  date: string;
  minutes: number;
}

const HEARTBEAT_MS = 5 * 60 * 1000;
const SESSION_GAP_MS = 10 * 60 * 1000;
const SESSION_MAX_MS = 8 * 60 * 60 * 1000;

const PRESENCE_ACTIONS = new Set([
  "login",
  "logout",
  "session_active",
  "page_view",
]);

function localDateKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function buildSessions(timestamps: number[]): Array<{ start: number; end: number }> {
  if (timestamps.length === 0) {
    return [];
  }

  const sessions: Array<{ start: number; end: number }> = [];
  let start = timestamps[0];
  let end = timestamps[0];

  for (let index = 1; index < timestamps.length; index += 1) {
    const current = timestamps[index];
    if (current - end <= SESSION_GAP_MS) {
      end = current;
      continue;
    }
    sessions.push({
      start,
      end: Math.min(end + HEARTBEAT_MS, start + SESSION_MAX_MS),
    });
    start = current;
    end = current;
  }

  sessions.push({
    start,
    end: Math.min(end + HEARTBEAT_MS, start + SESSION_MAX_MS),
  });

  return sessions;
}

function allocateSessionMinutes(
  session: { start: number; end: number },
  totals: Map<string, number>,
) {
  let cursor = session.start;
  while (cursor < session.end) {
    const dayKey = localDateKey(new Date(cursor).toISOString());
    const dayStart = new Date(`${dayKey}T00:00:00`).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const segmentEnd = Math.min(session.end, dayEnd);
    const minutes = Math.max(0, Math.round((segmentEnd - cursor) / 60000));
    totals.set(dayKey, (totals.get(dayKey) ?? 0) + minutes);
    cursor = segmentEnd;
  }
}

export function computeDailyAccessDurations(
  logs: ActivityLogEntry[],
  from: string,
  to: string,
): DailyAccessDuration[] {
  const timestamps = logs
    .filter((log) => PRESENCE_ACTIONS.has(log.action))
    .map((log) => new Date(log.createdAt).getTime())
    .sort((a, b) => a - b);

  const totals = new Map<string, number>();
  for (const session of buildSessions(timestamps)) {
    allocateSessionMinutes(session, totals);
  }

  return enumerateDates(from, to).map((date) => ({
    date,
    minutes: totals.get(date) ?? 0,
  }));
}

export function formatAccessMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "0분";
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}분`;
  }
  if (rest === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${rest}분`;
}

export function getMonthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    year,
    month,
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    label: `${year}년 ${month}월`,
  };
}

export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

export function getPreviousMonthRange(year: number, month: number) {
  const date = new Date(year, month - 2, 1);
  return getMonthRange(date.getFullYear(), date.getMonth() + 1);
}

export function sumDailyMinutes(days: DailyAccessDuration[]): number {
  return days.reduce((total, day) => total + day.minutes, 0);
}
