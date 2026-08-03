import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { upsertOvertimeWindow } from "@/lib/overtime-window-store";
import type { OvertimeType } from "@/lib/types";

interface RouteContext {
  params: Promise<{ type: string }>;
}

function parseOvertimeType(value: string): OvertimeType | null {
  if (value === "regular" || value === "flexible") {
    return value;
  }
  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { type: rawType } = await context.params;
    const type = parseOvertimeType(rawType);
    if (!type) {
      return NextResponse.json(
        { error: "유효하지 않은 시간외근무 유형입니다." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      startsAt?: string;
      endsAt?: string;
      enabled?: boolean;
    };

    if (!body.startsAt || !body.endsAt) {
      return NextResponse.json(
        { error: "등록 시작·종료 일시를 입력해 주세요." },
        { status: 400 },
      );
    }

    const window = await upsertOvertimeWindow(type, {
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      enabled: body.enabled ?? true,
      updatedBy: auth.session.id,
    });

    return NextResponse.json({ window });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "등록 기간 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
