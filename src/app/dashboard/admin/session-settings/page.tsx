import { SessionSettingsPanel } from "@/components/admin/session-settings-panel";

export default function AdminSessionSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">세션 설정</h1>
        <p className="mt-2 text-sm text-slate-600">
          사용자 미사용 시 자동 로그아웃되는 시간을 설정합니다. 설정은 모든
          사용자에게 즉시 적용됩니다.
        </p>
      </div>
      <SessionSettingsPanel />
    </div>
  );
}
