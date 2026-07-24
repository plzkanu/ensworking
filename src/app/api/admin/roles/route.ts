import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import {
  countUsersByRole,
  createRole,
  listRoles,
} from "@/lib/roles-store";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const roles = await listRoles(includeInactive);

    const rolesWithCount = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        userCount: await countUsersByRole(role.code),
      })),
    );

    return NextResponse.json({ roles: rolesWithCount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "역할 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      code?: string;
      name?: string;
      description?: string;
      sortOrder?: number;
      active?: boolean;
    };

    if (!body.code?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "역할 코드와 이름은 필수입니다." },
        { status: 400 },
      );
    }

    const role = await createRole({
      code: body.code.trim(),
      name: body.name.trim(),
      description: body.description,
      sortOrder: body.sortOrder,
      active: body.active,
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "역할 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
