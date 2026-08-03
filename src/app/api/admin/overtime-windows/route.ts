import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { listOvertimeWindows } from "@/lib/overtime-window-store";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const windows = await listOvertimeWindows();
    return NextResponse.json({ windows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "등록 기간 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
