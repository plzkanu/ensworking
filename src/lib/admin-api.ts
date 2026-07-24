import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await getSessionUser();
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }
  if (!requireAdmin(session)) {
    return {
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 },
      ),
    };
  }
  return { session };
}
