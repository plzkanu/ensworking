import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { deleteUser, getUserById, updateUser } from "@/lib/users-store";
import { toUserPublic } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ user: toUserPublic(user) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      password?: string;
      employeeNumber?: string;
      name?: string;
      position?: string;
      department?: string;
      role?: string;
      active?: boolean;
    };

    const user = await updateUser(id, body);
    return NextResponse.json({ user: toUserPublic(user) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    await deleteUser(id, auth.session.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
