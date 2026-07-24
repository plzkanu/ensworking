import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { deleteRole, getRoleByCode, updateRole } from "@/lib/roles-store";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { code } = await context.params;
    const role = await getRoleByCode(code);
    if (!role) {
      return NextResponse.json(
        { error: "역할을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ role });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "역할 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      sortOrder?: number;
      active?: boolean;
    };

    const role = await updateRole(code, body);
    return NextResponse.json({ role });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "역할 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { code } = await context.params;
    await deleteRole(code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "역할 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
