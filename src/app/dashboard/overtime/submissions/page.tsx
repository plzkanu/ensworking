import { ErpSubmissionsPanel } from "@/components/admin/erp-submissions-panel";
import { getSessionUser } from "@/lib/auth";
import { getErpSubmissionViewScope } from "@/lib/erp-submission-access";

export default async function MyErpSubmissionsPage() {
  const user = await getSessionUser();
  const viewScope = user ? getErpSubmissionViewScope(user) : "own";

  const title =
    viewScope === "own" ? "내 ERP 제출 내역" : "ERP 제출 내역";
  const description =
    viewScope === "own"
      ? "내가 저장한 ERP 양식 데이터를 조회합니다."
      : viewScope === "department"
        ? "소속 사업소 사용자가 저장한 ERP 양식 데이터를 조회합니다."
        : "사용자가 저장한 ERP 양식 데이터를 유형·연월·소속 기준으로 조회합니다.";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      <ErpSubmissionsPanel />
    </div>
  );
}
