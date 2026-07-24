import { UserManagementPanel } from "@/components/admin/user-management-panel";

export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">사용자 관리</h1>
        <p className="mt-2 text-sm text-slate-600">
          아이디, 비밀번호, 사번, 이름, 직급, 소속, 역할을 등록·수정·삭제합니다.
          엑셀 양식으로 일괄 등록도 지원합니다.
        </p>
      </div>
      <UserManagementPanel />
    </div>
  );
}
