import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { createUser, listUsers } from "@/lib/users-store";
import { toUserPublic } from "@/lib/types";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const users = await listUsers();
    return NextResponse.json({ users: users.map(toUserPublic) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      id?: string;
      password?: string;
      employeeNumber?: string;
      name?: string;
      position?: string;
      department?: string;
      role?: string;
      active?: boolean;
    };

    if (!body.id?.trim() || !body.password?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "아이디, 비밀번호, 이름은 필수입니다." },
        { status: 400 },
      );
    }

    if (!body.role?.trim()) {
      return NextResponse.json(
        { error: "역할을 선택해 주세요." },
        { status: 400 },
      );
    }

    const user = await createUser({
      id: body.id,
      password: body.password,
      employeeNumber: body.employeeNumber,
      name: body.name,
      position: body.position,
      department: body.department,
      role: body.role,
      active: body.active,
    });

    return NextResponse.json({ user: toUserPublic(user) }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
