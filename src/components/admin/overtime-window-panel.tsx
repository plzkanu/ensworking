"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/components/admin/form-styles";
import {
  formatOvertimeWindowRange,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type OvertimeRegistrationWindow,
  type OvertimeType,
} from "@/lib/types";

interface WindowFormState {
  startsAt: string;
  endsAt: string;
  enabled: boolean;
}

const TYPE_META: Record<
  OvertimeType,
  { title: string; description: string }
> = {
  regular: {
    title: "시간외근무 (일반)",
    description: "일반근무 대상자 시간외근무 등록 허용 기간",
  },
  flexible: {
    title: "시간외근무 (유연)",
    description: "유연근무 대상자 시간외근무 등록 허용 기간",
  },
};

function emptyForm(): WindowFormState {
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    startsAt: toDatetimeLocalValue(now.toISOString()),
    endsAt: toDatetimeLocalValue(weekLater.toISOString()),
    enabled: true,
  };
}

function toForm(window: OvertimeRegistrationWindow): WindowFormState {
  return {
    startsAt: toDatetimeLocalValue(window.startsAt),
    endsAt: toDatetimeLocalValue(window.endsAt),
    enabled: window.enabled,
  };
}

export function OvertimeWindowPanel() {
  const [windows, setWindows] = useState<OvertimeRegistrationWindow[]>([]);
  const [forms, setForms] = useState<Record<OvertimeType, WindowFormState>>({
    regular: emptyForm(),
    flexible: emptyForm(),
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<OvertimeType | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadWindows() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overtime-windows");
      const data = (await response.json()) as {
        windows?: OvertimeRegistrationWindow[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "등록 기간을 불러오지 못했습니다.");
      }

      const nextForms: Record<OvertimeType, WindowFormState> = {
        regular: emptyForm(),
        flexible: emptyForm(),
      };
      for (const window of data.windows ?? []) {
        nextForms[window.overtimeType] = toForm(window);
      }
      setWindows(data.windows ?? []);
      setForms(nextForms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWindows();
  }, []);

  async function handleSubmit(type: OvertimeType, event: FormEvent) {
    event.preventDefault();
    setSubmitting(type);
    setError("");
    setMessage("");

    try {
      const form = forms[type];
      const response = await fetch(
        `/api/admin/overtime-windows/${encodeURIComponent(type)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startsAt: fromDatetimeLocalValue(form.startsAt),
            endsAt: fromDatetimeLocalValue(form.endsAt),
            enabled: form.enabled,
          }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      setMessage(`${TYPE_META[type].title} 등록 기간이 저장되었습니다.`);
      await loadWindows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(null);
    }
  }

  function updateForm(type: OvertimeType, patch: Partial<WindowFormState>) {
    setForms((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  }

  if (loading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
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

      {(["regular", "flexible"] as OvertimeType[]).map((type) => {
        const meta = TYPE_META[type];
        const saved = windows.find((window) => window.overtimeType === type);
        const form = forms[type];

        return (
          <section
            key={type}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[#004b87]">
                {meta.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{meta.description}</p>
              {saved ? (
                <p className="mt-2 text-xs text-slate-500">
                  현재 저장값: {formatOvertimeWindowRange(saved.startsAt, saved.endsAt)}
                  {saved.enabled ? "" : " · 비활성"}
                </p>
              ) : null}
            </div>

            <form onSubmit={(event) => void handleSubmit(type, event)} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor={`${type}-starts`} className={labelClassName}>
                    등록 시작 일시
                  </label>
                  <input
                    id={`${type}-starts`}
                    type="datetime-local"
                    className={inputClassName}
                    value={form.startsAt}
                    onChange={(e) =>
                      updateForm(type, { startsAt: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`${type}-ends`} className={labelClassName}>
                    등록 종료 일시
                  </label>
                  <input
                    id={`${type}-ends`}
                    type="datetime-local"
                    className={inputClassName}
                    value={form.endsAt}
                    onChange={(e) => updateForm(type, { endsAt: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    updateForm(type, { enabled: e.target.checked })
                  }
                />
                등록 기간 사용 (체크 해제 시 사용자 접근 불가)
              </label>

              <button
                type="submit"
                disabled={submitting === type}
                className={buttonPrimaryClassName}
              >
                {submitting === type ? "저장 중..." : "저장"}
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
