import { ErpSubmissionsPanel } from "@/components/admin/erp-submissions-panel";

export default function MyErpSubmissionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">내 ERP 제출 내역</h1>
        <p className="mt-2 text-sm text-slate-600">
          내가 저장한 ERP 양식 데이터를 조회합니다.
        </p>
      </div>
      <ErpSubmissionsPanel />
    </div>
  );
}
