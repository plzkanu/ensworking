import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logUserActivity } from "@/lib/activity-log-store";
import { getRequestMeta } from "@/lib/request-meta";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      action?: string;
      resource?: string;
      detail?: string;
    };

    const action = body.action?.trim() ?? "page_view";
    const resource = body.resource?.trim() ?? "";
    const detail = body.detail?.trim() ?? "";
    const { ip } = getRequestMeta(request);

    await logUserActivity({
      userId: session.id,
      action,
      resource,
      detail,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "활동 로그 기록 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
