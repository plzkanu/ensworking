import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import {
  parseRecordedDate,
  updateManualAdminChangeLog,
} from "@/lib/admin-change-log-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string; date?: string };
    const content = body.content?.trim() ?? "";
    const recordedDate = parseRecordedDate(body.date ?? "");

    if (!content) {
      return NextResponse.json(
        { error: "수정 내용을 입력해 주세요." },
        { status: 400 },
      );
    }

    if (!recordedDate) {
      return NextResponse.json(
        { error: "유효한 날짜를 선택해 주세요." },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "수정 내용은 5,000자 이내로 입력해 주세요." },
        { status: 400 },
      );
    }

    const log = await updateManualAdminChangeLog(id, {
      content,
      recordedDate,
    });

    return NextResponse.json({ log });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "수정 현황 변경에 실패했습니다.";
    const status = message.includes("찾을 수 없습니다") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
