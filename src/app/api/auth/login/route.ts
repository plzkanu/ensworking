import { NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth";
import { logUserAccess } from "@/lib/access-log-store";
import { logUserActivity } from "@/lib/activity-log-store";
import { getRequestMeta } from "@/lib/request-meta";
import { toSessionUser } from "@/lib/types";
import { verifyUserCredentials } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    const userId = body.userId?.trim() ?? "";
    const password = body.password ?? "";

    if (!userId || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const user = await verifyUserCredentials(userId, password);
    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const { ip, userAgent } = getRequestMeta(request);
    await logUserAccess({
      userId: user.id,
      eventType: "login",
      ipAddress: ip,
      userAgent,
    });
    await logUserActivity({
      userId: user.id,
      action: "login",
      resource: "/login",
      ipAddress: ip,
    });

    const sessionUser = toSessionUser(user);

    const response = NextResponse.json({
      user: sessionUser,
      mustChangePassword: user.mustChangePassword,
    });

    return attachSessionCookie(response, sessionUser);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "로그인 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
