import Link from "next/link";

export default function DashboardHomePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">시간외근무 ERP</h1>
        <p className="mt-2 text-sm text-slate-600">
          HWP 근무일지 파싱, 검증, ERP 양식 다운로드를 지원합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/overtime/regular"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#009ada]/40 hover:shadow-md"
        >
          <h2 className="font-semibold text-[#004b87]">⏱️ 시간외근무 (일반)</h2>
          <p className="mt-2 text-sm text-slate-500">
            일반 근무 대상자의 시간외근무일지를 파싱하고 ERP 양식을 생성합니다.
          </p>
        </Link>

        <Link
          href="/dashboard/overtime/flexible"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#009ada]/40 hover:shadow-md"
        >
          <h2 className="font-semibold text-[#004b87]">🔄 시간외근무 (유연)</h2>
          <p className="mt-2 text-sm text-slate-500">
            유연근무 대상자용 도구입니다. 시간대 변환 및 ERP 제출 전 검증을
            포함합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}
