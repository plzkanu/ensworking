import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSessionSettings } from "@/lib/session-settings-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const settings = await getSessionSettings();
    return NextResponse.json({
      inactivityTimeoutMinutes: settings.inactivityTimeoutMinutes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "세션 설정을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
