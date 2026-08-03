import { ErpSubmissionsPanel } from "@/components/admin/erp-submissions-panel";

export default function AdminErpSubmissionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">ERP 제출 내역</h1>
        <p className="mt-2 text-sm text-slate-600">
          사용자가 저장한 ERP 양식 데이터를 유형·연월·제출자 기준으로 조회합니다.
        </p>
      </div>
      <ErpSubmissionsPanel adminView />
    </div>
  );
}
