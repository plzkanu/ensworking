import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import {
  getSessionSettings,
  updateSessionSettings,
} from "@/lib/session-settings-store";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const settings = await getSessionSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "세션 설정 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      inactivityTimeoutMinutes?: number;
    };

    const settings = await updateSessionSettings({
      inactivityTimeoutMinutes: body.inactivityTimeoutMinutes ?? 0,
      updatedBy: auth.session.id,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "세션 설정 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
