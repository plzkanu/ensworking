"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import { INACTIVITY_TIMEOUT_OPTIONS } from "@/lib/session-settings-constants";
import type { SessionSettings } from "@/lib/types";

function formatDateTime(value: string) {
  if (!value || value === new Date(0).toISOString()) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR");
}

export function SessionSettingsPanel() {
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session-settings");
      const data = (await response.json()) as {
        settings?: SessionSettings;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "세션 설정을 불러오지 못했습니다.");
      }
      const next = data.settings ?? null;
      setSettings(next);
      if (next) {
        setTimeoutMinutes(next.inactivityTimeoutMinutes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/session-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inactivityTimeoutMinutes: timeoutMinutes }),
      });
      const data = (await response.json()) as {
        settings?: SessionSettings;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      setSettings(data.settings ?? null);
      setMessage("미사용 자동 로그아웃 시간이 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#004b87]">
            미사용 자동 로그아웃
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            사용자가 마우스·키보드 등 입력 없이 설정 시간 동안 미사용 상태면
            자동으로 로그아웃됩니다.
          </p>
          {settings ? (
            <p className="mt-2 text-xs text-slate-500">
              현재 저장값: {settings.inactivityTimeoutMinutes}분 · 최종 수정{" "}
              {formatDateTime(settings.updatedAt)}
            </p>
          ) : null}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="max-w-xs">
            <label htmlFor="inactivity-timeout" className={labelClassName}>
              미사용 타임아웃
            </label>
            <select
              id="inactivity-timeout"
              className={inputClassName}
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
            >
              {INACTIVITY_TIMEOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={buttonPrimaryClassName}
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </form>
      </section>
    </div>
  );
}
