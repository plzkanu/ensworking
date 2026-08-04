"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import type { AdminChangeLogEntry } from "@/lib/types";

function todayKstDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function formatDateHeading(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function groupLogsByDate(logs: AdminChangeLogEntry[]) {
  const groups = new Map<string, AdminChangeLogEntry[]>();
  for (const log of logs) {
    const dateKey = log.recordedDate;
    const bucket = groups.get(dateKey) ?? [];
    bucket.push(log);
    groups.set(dateKey, bucket);
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function ChangeLogsPanel({ canEdit = false }: { canEdit?: boolean }) {
  const formRef = useRef<HTMLElement>(null);
  const [logs, setLogs] = useState<AdminChangeLogEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordedDate, setRecordedDate] = useState(todayKstDateString);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);

  function resetForm() {
    setEditingId(null);
    setContent("");
    setRecordedDate(todayKstDateString());
    setSaveError("");
  }

  function startEdit(log: AdminChangeLogEntry) {
    setEditingId(log.id);
    setRecordedDate(log.recordedDate);
    setContent(log.summary);
    setSaveError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/change-logs?limit=300");
      const data = (await response.json()) as {
        logs?: AdminChangeLogEntry[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "수정 현황을 불러오지 못했습니다.");
      }
      setLogs(data.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setSaveError("수정 내용을 입력해 주세요.");
      return;
    }
    if (!recordedDate) {
      setSaveError("날짜를 선택해 주세요.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        editingId
          ? `/api/admin/change-logs/${encodeURIComponent(editingId)}`
          : "/api/admin/change-logs",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed, date: recordedDate }),
        },
      );
      const data = (await response.json()) as {
        log?: AdminChangeLogEntry;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }

      await loadLogs();
      resetForm();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <section
          ref={formRef}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#004b87]">
            {editingId ? "수정 내역 편집" : "수정 내역 등록"}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label htmlFor="change-date" className={labelClassName}>
                  날짜
                </label>
                <input
                  id="change-date"
                  type="date"
                  className={inputClassName}
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="change-content" className={labelClassName}>
                  수정 내용
                </label>
                <textarea
                  id="change-content"
                  rows={5}
                  className={`${inputClassName} resize-y min-h-[120px]`}
                  placeholder="변경한 내용을 입력하세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            {saveError ? (
              <p className="text-sm text-red-600">{saveError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              {editingId ? (
                <button
                  type="button"
                  className={buttonSecondaryClassName}
                  onClick={resetForm}
                  disabled={saving}
                >
                  취소
                </button>
              ) : null}
              <button
                type="submit"
                className={buttonPrimaryClassName}
                disabled={saving || !content.trim() || !recordedDate}
              >
                {saving ? "저장 중..." : editingId ? "변경 저장" : "저장"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
          불러오는 중...
        </p>
      ) : logs.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
          저장된 수정 내역이 없습니다.
        </p>
      ) : (
        groupedLogs.map(([dateKey, dayLogs]) => (
          <section
            key={dateKey}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#004b87]">
                {formatDateHeading(dateKey)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{dayLogs.length}건</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {dayLogs.map((log) => (
                <li key={log.id} className="px-5 py-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>입력 {formatDateTime(log.createdAt)}</span>
                      <span>
                        {log.adminName} ({log.adminId})
                      </span>
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        className={`${buttonSecondaryClassName} px-3 py-1.5 text-xs`}
                        onClick={() => startEdit(log)}
                        disabled={saving && editingId === log.id}
                      >
                        수정
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {log.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
