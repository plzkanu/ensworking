import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/users-store";

export default async function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.id);
  if (!user?.mustChangePassword) {
    redirect("/dashboard");
  }

  return children;
}
