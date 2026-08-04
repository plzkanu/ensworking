import { AdminChangeLogsPanel } from "@/components/admin/admin-change-logs-panel";

export default function AdminChangeLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">수정 현황</h1>
        <p className="mt-2 text-sm text-slate-600">
          관리자가 변경한 내용을 직접 입력·저장하고, 최신순으로 조회합니다.
        </p>
      </div>
      <AdminChangeLogsPanel />
    </div>
  );
}
