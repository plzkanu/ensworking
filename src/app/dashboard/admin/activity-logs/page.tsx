import { ActivityLogsPanel } from "@/components/admin/activity-logs-panel";

export default function AdminActivityLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">사용 로그</h1>
        <p className="mt-2 text-sm text-slate-600">
          접속 사용자별 일별 접속 시간(막대그래프)과 활동 상세 내역을 확인합니다.
          기본 조회는 당월이며, 전월·기간 설정으로 변경할 수 있습니다.
        </p>
      </div>
      <ActivityLogsPanel />
    </div>
  );
}
