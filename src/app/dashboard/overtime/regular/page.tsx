import Link from "next/link";
import { OvertimeToolFrame } from "@/components/overtime-tool-frame";
import { requireOvertimePageAccess } from "@/lib/overtime-access";

export default async function RegularOvertimePage() {
  await requireOvertimePageAccess("regular");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#004b87]">
            시간외근무 (일반근무)
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            사원명부(DB) 자동 연동 → HWP 근무일지 파싱 → 오류 검토 → ERP 양식 저장
          </p>
        </div>
        <Link
          href="/dashboard/overtime/submissions"
          className="text-sm font-medium text-[#004b87] hover:underline"
        >
          내 ERP 제출 내역
        </Link>
      </div>
      <OvertimeToolFrame variant="regular" />
    </div>
  );
}
