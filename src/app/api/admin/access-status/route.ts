import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { getUserAccessStatusList } from "@/lib/access-log-store";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const items = await getUserAccessStatusList();
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "접속 현황 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
