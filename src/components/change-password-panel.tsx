"use client";

import { FormEvent, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20";

interface ChangePasswordPanelProps {
  onSuccess?: () => void;
  showReturnToLogin?: boolean;
  description?: React.ReactNode;
  submitLabel?: string;
}

export function ChangePasswordPanel({
  onSuccess,
  showReturnToLogin = false,
  description,
  submitLabel = "비밀번호 변경",
}: ChangePasswordPanelProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturningToLogin, setIsReturningToLogin] = useState(false);

  async function handleReturnToLogin() {
    setError("");
    setIsReturningToLogin(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setError("로그인 화면으로 이동하지 못했습니다.");
    } finally {
      setIsReturningToLogin(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "비밀번호 변경에 실패했습니다.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch {
      setError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      {description ? (
        <div className="text-center text-sm text-slate-500">{description}</div>
      ) : null}

      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          현재 비밀번호
        </label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="현재 비밀번호"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          새 비밀번호
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="새 비밀번호"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          새 비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="새 비밀번호 확인"
          className={inputClassName}
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || isReturningToLogin}
        className="w-full rounded-lg bg-[#004b87] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003a6a] focus:outline-none focus:ring-2 focus:ring-[#004b87]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "변경 중..." : submitLabel}
      </button>

      {showReturnToLogin ? (
        <button
          type="button"
          onClick={() => void handleReturnToLogin()}
          disabled={isSubmitting || isReturningToLogin}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isReturningToLogin ? "이동 중..." : "ID/PW 재입력"}
        </button>
      ) : null}
    </form>
  );
}
