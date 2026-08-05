import { ChangePasswordForm } from "@/components/change-password-form";
import { InactivityLogout } from "@/components/inactivity-logout";

export default function ChangePasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-slate-100 px-4 py-12">
      <InactivityLogout />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#a4ce3920,_transparent_45%),radial-gradient(circle_at_bottom_left,_#009ada18,_transparent_40%)]"
      />
      <ChangePasswordForm />
    </div>
  );
}
