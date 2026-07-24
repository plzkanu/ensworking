import { redirect } from "next/navigation";
import { getSessionUser, requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!requireAdmin(user)) {
    redirect("/dashboard");
  }

  return children;
}
