import { AccessStatusPanel } from "@/components/admin/access-status-panel";

export default function AdminAccessStatusPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">접속 현황</h1>
        <p className="mt-2 text-sm text-slate-600">
          사용자별 최근 로그인·로그아웃, 접속 상태, 30일 로그인 횟수 및 최근
          활동을 확인합니다.
        </p>
      </div>
      <AccessStatusPanel />
    </div>
  );
}
