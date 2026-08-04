import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import {
  getProgramFeedbackById,
  updateProgramFeedbackAdmin,
  validateProgramFeedbackAdminUpdate,
} from "@/lib/program-feedback-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!requireAdmin(user)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const existing = await getProgramFeedbackById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "의견을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      status?: string;
      adminResponse?: string;
    };
    const validated = validateProgramFeedbackAdminUpdate(body);

    const feedback = await updateProgramFeedbackAdmin(id, {
      ...validated,
      adminId: user.id,
      adminName: user.name,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "의견 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
