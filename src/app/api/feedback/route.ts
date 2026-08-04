import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createProgramFeedbackFromSession,
  listProgramFeedbacks,
} from "@/lib/program-feedback-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const isAdmin = user.role === "admin";
    const feedbacks = await listProgramFeedbacks({
      userId: isAdmin ? undefined : user.id,
      limit: isAdmin ? 300 : 100,
    });

    return NextResponse.json({ feedbacks, isAdmin });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "의견 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      category?: string;
      title?: string;
      content?: string;
    };

    const feedback = await createProgramFeedbackFromSession(user, body);
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "의견 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
