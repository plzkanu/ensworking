import { OvertimeWindowPanel } from "@/components/admin/overtime-window-panel";

export default function AdminOvertimeWindowsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">등록 기간 설정</h1>
        <p className="mt-2 text-sm text-slate-600">
          시간외근무(일반·유연) 화면을 사용자가 열 수 있는 등록 시작·종료
          일시를 설정합니다. 기간 외에는 일반 사용자의 접근이 차단됩니다.
        </p>
      </div>
      <OvertimeWindowPanel />
    </div>
  );
}
