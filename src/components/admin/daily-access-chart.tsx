"use client";

import type { DailyAccessDuration } from "@/lib/activity-daily-duration";
import { formatAccessMinutes } from "@/lib/activity-daily-duration";

interface DailyAccessChartProps {
  days: DailyAccessDuration[];
  periodLabel: string;
  loading?: boolean;
}

export function DailyAccessChart({
  days,
  periodLabel,
  loading = false,
}: DailyAccessChartProps) {
  const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        일별 접속 시간을 불러오는 중...
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        표시할 접속 시간 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {periodLabel} · 총 접속 {formatAccessMinutes(totalMinutes)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/70 p-4">
        <div
          className="flex items-end gap-1.5"
          style={{ minWidth: `${days.length * 32}px`, height: "220px" }}
        >
          {days.map((day) => {
            const heightPercent = day.minutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
            const dayNumber = day.date.slice(8);
            return (
              <div
                key={day.date}
                className="flex h-full w-7 flex-col items-center justify-end gap-1"
                title={`${day.date}: ${formatAccessMinutes(day.minutes)}`}
              >
                <span className="min-h-[14px] text-[10px] font-medium text-slate-500">
                  {day.minutes > 0 ? formatAccessMinutes(day.minutes) : ""}
                </span>
                <div className="flex h-40 w-full items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      day.minutes > 0 ? "bg-[#3182F6]" : "bg-transparent"
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: day.minutes > 0 ? "4px" : "0",
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{dayNumber}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
