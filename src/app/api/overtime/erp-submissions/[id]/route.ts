import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canAccessErpSubmission } from "@/lib/erp-submission-access";
import { getErpSubmissionById } from "@/lib/erp-submission-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const submission = await getErpSubmissionById(id);
    if (!submission) {
      return NextResponse.json(
        { error: "제출 내역을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (!canAccessErpSubmission(user, submission)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "제출 내역 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
