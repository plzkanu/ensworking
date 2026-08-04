import { ChangeLogsPanel } from "@/components/feedback/change-logs-panel";
import { getSessionUser, requireAdmin } from "@/lib/auth";

export default async function FeedbackChangeLogsPage() {
  const user = await getSessionUser();
  const canEdit = user ? requireAdmin(user) : false;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">수정 현황</h1>
        <p className="mt-2 text-sm text-slate-600">
          프로그램 변경·수정 내역을 날짜별로 확인합니다.
          {canEdit ? " 관리자는 내용을 등록·수정할 수 있습니다." : ""}
        </p>
      </div>
      <ChangeLogsPanel canEdit={canEdit} />
    </div>
  );
}
