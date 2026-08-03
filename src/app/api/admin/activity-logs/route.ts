import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { listActivityLogs } from "@/lib/activity-log-store";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() || undefined;
    const action = searchParams.get("action")?.trim() || undefined;
    const from = searchParams.get("from")?.trim() || undefined;
    const to = searchParams.get("to")?.trim() || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const logs = await listActivityLogs({
      userId,
      action,
      from: from ? `${from}T00:00:00.000Z` : undefined,
      to: to ? `${to}T23:59:59.999Z` : undefined,
      limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용 로그 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
