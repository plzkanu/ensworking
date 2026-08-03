import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { resetUserPassword } from "@/lib/users-store";
import { toUserPublic } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const user = await resetUserPassword(id);
    return NextResponse.json({ user: toUserPublic(user) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "비밀번호 초기화에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
