import { ActivityLogsPanel } from "@/components/admin/activity-logs-panel";

export default function AdminActivityLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">사용 로그</h1>
        <p className="mt-2 text-sm text-slate-600">
          로그인, 로그아웃, 화면 조회 등 사용자 활동 이력을 조회합니다.
        </p>
      </div>
      <ActivityLogsPanel />
    </div>
  );
}
