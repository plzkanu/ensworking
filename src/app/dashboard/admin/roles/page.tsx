import { RoleManagementPanel } from "@/components/admin/role-management-panel";

export default function AdminRolesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">역할 관리</h1>
        <p className="mt-2 text-sm text-slate-600">
          역할 코드와 역할명을 별도로 운영합니다. 기본 역할: 관리자(admin),
          사업소담당자(office_manager), 모니터링(monitoring).
        </p>
      </div>
      <RoleManagementPanel />
    </div>
  );
}
