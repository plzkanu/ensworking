import Link from "next/link";
import { OvertimeToolFrame } from "@/components/overtime-tool-frame";
import { requireOvertimePageAccess } from "@/lib/overtime-access";

export default async function FlexibleOvertimePage() {
  await requireOvertimePageAccess("flexible");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#004b87]">
            시간외근무 (유연근무)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            유연근무 대상자의 시간외근무일지 파싱 및 ERP 시간대 변환 (사원명부 DB 자동 연동)
          </p>
        </div>
        <Link
          href="/dashboard/overtime/submissions"
          className="text-sm font-medium text-[#004b87] hover:underline"
        >
          내 ERP 제출 내역
        </Link>
      </div>
      <OvertimeToolFrame variant="flexible" />
    </div>
  );
}
