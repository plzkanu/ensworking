import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { computeDailyAccessDurations } from "@/lib/activity-daily-duration";
import { listActivityLogs } from "@/lib/activity-log-store";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();

    if (!userId || !from || !to) {
      return NextResponse.json(
        { error: "userId, from, to 값이 필요합니다." },
        { status: 400 },
      );
    }

    const logs = await listActivityLogs({
      userId,
      from: `${from}T00:00:00.000Z`,
      to: `${to}T23:59:59.999Z`,
      limit: 20000,
    });

    const days = computeDailyAccessDurations(logs, from, to);

    return NextResponse.json({ days });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "일별 접속 시간 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
