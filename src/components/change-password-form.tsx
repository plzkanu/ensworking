"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordPanel } from "@/components/change-password-panel";
import { SoosanLogo } from "@/components/soosan-logo";

export function ChangePasswordForm() {
  const router = useRouter();

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

        <ChangePasswordPanel
          showReturnToLogin
          onSuccess={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        />
      </div>

      <p className="mt-6 text-xs text-slate-400">
        © SOOSAN. All rights reserved.
      </p>
    </div>
  );
}
