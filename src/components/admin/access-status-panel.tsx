"use client";

import { useEffect, useState } from "react";
import { inputClassName } from "@/components/admin/form-styles";
import type { UserAccessStatus } from "@/lib/types";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

export function AccessStatusPanel() {
  const [items, setItems] = useState<UserAccessStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">(
    "all",
  );

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/access-status");
      const data = (await response.json()) as {
        items?: UserAccessStatus[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "접속 현황을 불러오지 못했습니다.");
      }
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = items.filter((item) => {
    const matchesKeyword =
      !keyword.trim() ||
      item.userId.includes(keyword.trim()) ||
      item.userName.includes(keyword.trim()) ||
      item.department.includes(keyword.trim());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && item.isOnline) ||
      (statusFilter === "offline" && !item.isOnline);

    return matchesKeyword && matchesStatus;
  });

  const onlineCount = items.filter((item) => item.isOnline).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">전체 사용자</p>
          <p className="mt-1 text-2xl font-bold text-[#004b87]">{items.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">현재 접속</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{onlineCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">미접속</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">
            {items.length - onlineCount}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              검색
            </label>
            <input
              className={inputClassName}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="아이디, 이름, 소속"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              접속 상태
            </label>
            <select
              className={inputClassName}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "online" | "offline")
              }
            >
              <option value="all">전체</option>
              <option value="online">접속 중</option>
              <option value="offline">미접속</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            새로고침
          </button>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">표시할 데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">아이디</th>
                  <th className="px-2 py-2 font-medium">이름</th>
                  <th className="px-2 py-2 font-medium">소속</th>
                  <th className="px-2 py-2 font-medium">역할</th>
                  <th className="px-2 py-2 font-medium">접속 상태</th>
                  <th className="px-2 py-2 font-medium">마지막 로그인</th>
                  <th className="px-2 py-2 font-medium">마지막 로그아웃</th>
                  <th className="px-2 py-2 font-medium">접속 IP</th>
                  <th className="px-2 py-2 font-medium">30일 로그인</th>
                  <th className="px-2 py-2 font-medium">최근 활동</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.userId} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">
                      {item.userId}
                    </td>
                    <td className="px-2 py-2">{item.userName}</td>
                    <td className="px-2 py-2">{item.department || "-"}</td>
                    <td className="px-2 py-2">{item.role}</td>
                    <td className="px-2 py-2">
                      {item.isOnline ? (
                        <span className="text-emerald-600">접속 중</span>
                      ) : (
                        <span className="text-slate-400">미접속</span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDateTime(item.lastLoginAt)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDateTime(item.lastLogoutAt)}
                    </td>
                    <td className="px-2 py-2">{item.lastLoginIp || "-"}</td>
                    <td className="px-2 py-2">{item.loginCount30d}회</td>
                    <td className="px-2 py-2">
                      <div>{formatDateTime(item.lastActivityAt)}</div>
                      {item.lastActivityResource ? (
                        <div className="text-xs text-slate-400">
                          {item.lastActivityResource}
                        </div>
                      ) : null}
                    </td>
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
