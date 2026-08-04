import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/users-store";

/** Replit 배포 헬스체크는 / 에서 200 응답을 요구합니다. */
export default async function HomePage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.id);
  if (user?.mustChangePassword) {
    redirect("/change-password");
  }

  redirect("/dashboard");
}
