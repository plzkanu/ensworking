"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DailyAccessChart } from "@/components/admin/daily-access-chart";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import type { DailyAccessDuration } from "@/lib/activity-daily-duration";
import {
  formatAccessMinutes,
  getCurrentMonthRange,
  getMonthRange,
  getPreviousMonthRange,
  sumDailyMinutes,
} from "@/lib/activity-daily-duration";
import type { ActivityLogEntry, UserPublic } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  login: "로그인",
  logout: "로그아웃",
  page_view: "화면 조회",
  session_active: "세션 활동",
};

interface UserLogGroup {
  userId: string;
  userName: string;
  department: string;
  logs: ActivityLogEntry[];
  lastActivityAt: string;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function groupLogsByUser(
  logs: ActivityLogEntry[],
  users: UserPublic[],
): UserLogGroup[] {
  const userMap = new Map(users.map((user) => [user.id, user]));
  const groups = new Map<string, ActivityLogEntry[]>();

  for (const log of logs) {
    const existing = groups.get(log.userId) ?? [];
    existing.push(log);
    groups.set(log.userId, existing);
  }

  return [...groups.entries()]
    .map(([userId, userLogs]) => {
      const sorted = [...userLogs].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const user = userMap.get(userId);
      return {
        userId,
        userName: user?.name ?? sorted[0]?.userName ?? userId,
        department: user?.department ?? "",
        logs: sorted,
        lastActivityAt: sorted[0]?.createdAt ?? "",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime(),
    );
}

export function ActivityLogsPanel() {
  const initialMonth = getCurrentMonthRange();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);
  const [customFrom, setCustomFrom] = useState(initialMonth.from);
  const [customTo, setCustomTo] = useState(initialMonth.to);
  const [draftFrom, setDraftFrom] = useState(initialMonth.from);
  const [draftTo, setDraftTo] = useState(initialMonth.to);
  const [showPeriodPanel, setShowPeriodPanel] = useState(false);
  const [dailyDurations, setDailyDurations] = useState<DailyAccessDuration[]>(
    [],
  );
  const [userDurationTotals, setUserDurationTotals] = useState<
    Record<string, number>
  >({});

  const activeRange = useMemo(() => {
    if (periodMode === "custom") {
      return {
        from: customFrom,
        to: customTo,
        label: `${customFrom} ~ ${customTo}`,
      };
    }
    return getMonthRange(viewYear, viewMonth);
  }, [customFrom, customTo, periodMode, viewMonth, viewYear]);

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    const data = (await response.json()) as {
      users?: UserPublic[];
      error?: string;
    };
    if (response.ok) {
      setUsers(data.users ?? []);
    }
  }

  async function loadLogs(range = activeRange, act = action) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (act) params.set("action", act);
      params.set("from", range.from);
      params.set("to", range.to);
      params.set("limit", "5000");

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      const data = (await response.json()) as {
        logs?: ActivityLogEntry[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "사용 로그를 불러오지 못했습니다.");
      }
      setLogs(data.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  async function loadDailyDuration(userId: string, range = activeRange) {
    setChartLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        from: range.from,
        to: range.to,
      });
      const response = await fetch(
        `/api/admin/activity-logs/daily-duration?${params.toString()}`,
      );
      const data = (await response.json()) as {
        days?: DailyAccessDuration[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "일별 접속 시간을 불러오지 못했습니다.");
      }
      const days = data.days ?? [];
      setDailyDurations(days);
      setUserDurationTotals((prev) => ({
        ...prev,
        [userId]: sumDailyMinutes(days),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "접속 시간 조회 실패");
      setDailyDurations([]);
    } finally {
      setChartLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadLogs(activeRange, action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRange.from, activeRange.to]);

  useEffect(() => {
    if (!selectedUserId) {
      setDailyDurations([]);
      return;
    }
    void loadDailyDuration(selectedUserId, activeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, activeRange.from, activeRange.to]);

  const userGroups = useMemo(
    () => groupLogsByUser(logs, users),
    [logs, users],
  );

  const filteredUserGroups = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) {
      return userGroups;
    }
    return userGroups.filter(
      (group) =>
        group.userId.toLowerCase().includes(query) ||
        group.userName.toLowerCase().includes(query) ||
        group.department.toLowerCase().includes(query),
    );
  }, [keyword, userGroups]);

  useEffect(() => {
    if (filteredUserGroups.length === 0) {
      setSelectedUserId(null);
      return;
    }
    if (
      !selectedUserId ||
      !filteredUserGroups.some((group) => group.userId === selectedUserId)
    ) {
      setSelectedUserId(filteredUserGroups[0].userId);
    }
  }, [filteredUserGroups, selectedUserId]);

  const selectedGroup = filteredUserGroups.find(
    (group) => group.userId === selectedUserId,
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadLogs(activeRange, action);
  }

  function handlePrevMonth() {
    const previous = getPreviousMonthRange(viewYear, viewMonth);
    setPeriodMode("month");
    setViewYear(previous.year);
    setViewMonth(previous.month);
    setShowPeriodPanel(false);
  }

  function handleCurrentMonth() {
    const current = getCurrentMonthRange();
    setPeriodMode("month");
    setViewYear(current.year);
    setViewMonth(current.month);
    setShowPeriodPanel(false);
  }

  function handleApplyCustomPeriod(event: FormEvent) {
    event.preventDefault();
    if (!draftFrom || !draftTo || draftFrom > draftTo) {
      setError("기간 설정이 올바르지 않습니다.");
      return;
    }
    setPeriodMode("custom");
    setCustomFrom(draftFrom);
    setCustomTo(draftTo);
    setShowPeriodPanel(false);
    setError("");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#004b87]">조회 기간</h2>
            <p className="mt-1 text-sm text-slate-500">{activeRange.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={buttonSecondaryClassName}
            >
              전월
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className={buttonSecondaryClassName}
            >
              당월
            </button>
            <button
              type="button"
              onClick={() => setShowPeriodPanel((prev) => !prev)}
              className={buttonSecondaryClassName}
            >
              기간 설정
            </button>
          </div>
        </div>

        {showPeriodPanel ? (
          <form
            onSubmit={handleApplyCustomPeriod}
            className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label htmlFor="period-from" className={labelClassName}>
                시작일
              </label>
              <input
                id="period-from"
                type="date"
                className={inputClassName}
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="period-to" className={labelClassName}>
                종료일
              </label>
              <input
                id="period-to"
                type="date"
                className={inputClassName}
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className={buttonPrimaryClassName}>
                적용
              </button>
            </div>
          </form>
        ) : null}

        <form
          onSubmit={handleSearch}
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label htmlFor="log-action" className={labelClassName}>
              활동 유형
            </label>
            <select
              id="log-action"
              className={inputClassName}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">전체</option>
              <option value="login">로그인</option>
              <option value="logout">로그아웃</option>
              <option value="page_view">화면 조회</option>
              <option value="session_active">세션 활동</option>
            </select>
          </div>

          <div>
            <label htmlFor="log-keyword" className={labelClassName}>
              사용자 검색
            </label>
            <input
              id="log-keyword"
              type="text"
              className={inputClassName}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="아이디, 이름, 소속"
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className={`${buttonPrimaryClassName} w-full`}>
              조회
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#004b87]">접속 사용자</h2>
            <p className="mt-1 text-sm text-slate-500">
              사용자를 선택하면 일별 접속 시간과 상세 활동 내역을 확인할 수
              있습니다.
            </p>
          </div>
          {!loading ? (
            <p className="text-sm text-slate-600">
              {filteredUserGroups.length}명 · 로그 {logs.length}건
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : filteredUserGroups.length === 0 ? (
          <p className="text-sm text-slate-500">조회된 사용자가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,220px)] gap-2">
            {filteredUserGroups.map((group) => {
              const isSelected = selectedUserId === group.userId;
              const periodMinutes = userDurationTotals[group.userId];
              return (
                <button
                  key={group.userId}
                  type="button"
                  onClick={() => setSelectedUserId(group.userId)}
                  className={`flex h-[104px] w-[220px] flex-col rounded-xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[#004b87] bg-[#004b87]/5 shadow-sm ring-1 ring-[#004b87]/20"
                      : "border-slate-200 bg-slate-50 hover:border-[#004b87]/30 hover:bg-white"
                  }`}
                >
                  <div className="flex min-h-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {group.userName}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {group.userId}
                        {group.department ? ` · ${group.department}` : ""}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isSelected
                          ? "bg-[#004b87] text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {group.logs.length}건
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs font-medium text-[#004b87]">
                    {isSelected && chartLoading
                      ? "접속 시간 계산 중..."
                      : periodMinutes !== undefined
                        ? `기간 접속 ${formatAccessMinutes(periodMinutes)}`
                        : "접속 시간 보기"}
                  </div>
                  <div className="mt-auto truncate text-xs text-slate-400">
                    최근 {formatDateTime(group.lastActivityAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : !selectedGroup ? (
          <p className="text-sm text-slate-500">
            상세 내역을 보려면 접속 사용자를 선택해 주세요.
          </p>
        ) : (
          <>
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h2 className="text-base font-semibold text-[#004b87]">
                {selectedGroup.userName} 일별 접속 시간
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedGroup.userId}
                {selectedGroup.department
                  ? ` · ${selectedGroup.department}`
                  : ""}
              </p>
            </div>

            <DailyAccessChart
              days={dailyDurations}
              periodLabel={activeRange.label}
              loading={chartLoading}
            />

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">
                상세 활동 내역 · {selectedGroup.logs.length}건
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-2 font-medium">일시</th>
                      <th className="px-2 py-2 font-medium">활동</th>
                      <th className="px-2 py-2 font-medium">대상</th>
                      <th className="px-2 py-2 font-medium">상세</th>
                      <th className="px-2 py-2 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-2 py-2">{actionLabel(log.action)}</td>
                        <td className="px-2 py-2">{log.resource || "-"}</td>
                        <td className="px-2 py-2">{log.detail || "-"}</td>
                        <td className="px-2 py-2">{log.ipAddress || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
