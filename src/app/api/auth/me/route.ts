import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/users-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const dbUser = await getUserById(user.id);
  return NextResponse.json({
    user,
    mustChangePassword: dbUser?.mustChangePassword ?? false,
  });
}
