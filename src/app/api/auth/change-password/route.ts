import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeUserPassword, getUserById } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: "비밀번호 변경이 필요하지 않습니다." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호와 새 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    await changeUserPassword(session.id, { currentPassword, newPassword });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "비밀번호 변경 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
