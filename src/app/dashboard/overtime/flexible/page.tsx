import { OvertimeToolFrame } from "@/components/overtime-tool-frame";

export default function FlexibleOvertimePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">
          시간외근무 (유연근무)
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          유연근무 대상자의 시간외근무일지 파싱 및 ERP 시간대 변환을 지원합니다.
        </p>
      </div>
      <OvertimeToolFrame variant="flexible" />
    </div>
  );
}
