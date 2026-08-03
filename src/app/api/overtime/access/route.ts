import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { getOvertimeWindowStatus } from "@/lib/overtime-window-store";
import type { OvertimeType } from "@/lib/types";

function parseOvertimeType(value: string | null): OvertimeType | null {
  if (value === "regular" || value === "flexible") {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = parseOvertimeType(searchParams.get("type"));
  if (!type) {
    return NextResponse.json(
      { error: "유효하지 않은 시간외근무 유형입니다." },
      { status: 400 },
    );
  }

  try {
    const status = await getOvertimeWindowStatus(type);
    const open = status.open || requireAdmin(user);
    return NextResponse.json({
      open,
      message: open ? status.message : status.message,
      startsAt: status.startsAt,
      endsAt: status.endsAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "등록 기간 확인에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
