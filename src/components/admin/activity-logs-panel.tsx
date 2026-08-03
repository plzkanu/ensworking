"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import type { ActivityLogEntry, UserPublic } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  login: "로그인",
  logout: "로그아웃",
  page_view: "화면 조회",
  session_active: "세션 활동",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export function ActivityLogsPanel() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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

  async function loadLogs(filters?: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const uid = filters?.userId ?? userId;
      const act = filters?.action ?? action;
      const fromDate = filters?.from ?? from;
      const toDate = filters?.to ?? to;

      if (uid) params.set("userId", uid);
      if (act) params.set("action", act);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("limit", "200");

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

  useEffect(() => {
    void loadUsers();
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadLogs();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
        >
          <div>
            <label htmlFor="log-user" className={labelClassName}>
              사용자
            </label>
            <select
              id="log-user"
              className={inputClassName}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">전체</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.id})
                </option>
              ))}
            </select>
          </div>

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
            <label htmlFor="log-from" className={labelClassName}>
              시작일
            </label>
            <input
              id="log-from"
              type="date"
              className={inputClassName}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="log-to" className={labelClassName}>
              종료일
            </label>
            <input
              id="log-to"
              type="date"
              className={inputClassName}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className={`${buttonPrimaryClassName} w-full`}>
              조회
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">조회된 로그가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">일시</th>
                  <th className="px-2 py-2 font-medium">사용자</th>
                  <th className="px-2 py-2 font-medium">활동</th>
                  <th className="px-2 py-2 font-medium">대상</th>
                  <th className="px-2 py-2 font-medium">상세</th>
                  <th className="px-2 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-2 py-2">
                      <div>{log.userName}</div>
                      <div className="text-xs text-slate-400">{log.userId}</div>
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
        )}
      </section>
    </div>
  );
}
