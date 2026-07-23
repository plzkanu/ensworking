import { OvertimeToolFrame } from "@/components/overtime-tool-frame";

export default function RegularOvertimePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">
          시간외근무 (일반근무)
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          사원명부 업로드 → HWP 근무일지 파싱 → 오류 검토 → ERP 양식 다운로드
        </p>
      </div>
      <OvertimeToolFrame variant="regular" />
    </div>
  );
}
