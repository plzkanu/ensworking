import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listOvertimeWindowStatuses } from "@/lib/overtime-window-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const windows = await listOvertimeWindowStatuses();
    return NextResponse.json({ windows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "등록 기간 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
