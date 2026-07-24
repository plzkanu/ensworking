import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { listRoles } from "@/lib/roles-store";
import { buildUserTemplateBuffer } from "@/lib/user-excel";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const roles = await listRoles(true);
    const buffer = buildUserTemplateBuffer(roles);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="user_register_template.xlsx"; filename*=UTF-8\'\'%EC%82%AC%EC%9A%A9%EC%9E%90_%EB%93%B1%EB%A1%9D_%EC%96%91%EC%8B%9D.xlsx',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "양식 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
