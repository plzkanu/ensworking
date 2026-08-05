import { redirect } from "next/navigation";

import { ActivityTracker } from "@/components/activity-tracker";
import { AppSidebar } from "@/components/app-sidebar";
import { InactivityLogout } from "@/components/inactivity-logout";
import { syncSessionPresence } from "@/lib/access-log-store";
import { getSessionUser } from "@/lib/auth";
import { getServerRequestMeta } from "@/lib/server-request-meta";
import { getUserById } from "@/lib/users-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const dbUser = await getUserById(user.id);
  if (dbUser?.mustChangePassword) {
    redirect("/change-password");
  }

  const { ip, userAgent } = await getServerRequestMeta();
  await syncSessionPresence({
    userId: user.id,
    resource: "/dashboard",
    ipAddress: ip,
    userAgent,
  });

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <ActivityTracker />
      <InactivityLogout />
      <AppSidebar user={user} />
      <main className="ml-[220px] min-h-screen flex-1 p-7">{children}</main>
    </div>
  );
}
