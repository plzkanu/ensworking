import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listAdminChangeLogs } from "@/lib/admin-change-log-store";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "300");

    const logs = await listAdminChangeLogs({
      limit: Number.isFinite(limit) ? limit : 300,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "수정 현황 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
