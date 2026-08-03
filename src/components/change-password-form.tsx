"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SoosanLogo } from "@/components/soosan-logo";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div className="mb-8 flex w-full justify-center px-4">
        <div className="flex w-full items-center justify-center rounded-xl bg-white px-8 py-4 shadow-sm">
          <SoosanLogo className="mx-auto h-10 w-auto max-w-full object-contain object-center" />
        </div>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-lg shadow-slate-200/60">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#004b87]">
            비밀번호 변경
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            초기화된 비밀번호로 로그인하셨습니다.
            <br />
            서비스 이용을 위해 새 비밀번호를 설정해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#009ada] focus:ring-2 focus:ring-[#009ada]/20"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#004b87] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#003a6a] focus:outline-none focus:ring-2 focus:ring-[#004b87]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        © SOOSAN. All rights reserved.
      </p>
    </div>
  );
}
